#!/usr/bin/env python3
"""Build and publish the reference component images listed in dockerbuild-config.yaml.

Usage:
  python scripts/images.py list
  python scripts/images.py build <name>... [--push] [--platforms linux/amd64]
  python scripts/images.py republish [<name>...] [--dry-run]
  python scripts/images.py select --base <sha> --head <sha> [--include-workflow]
  python scripts/images.py select --names <name,name|all>

"build" and "republish" need Docker with buildx. "build --push" and "republish"
need a "docker login" that can push to the configured Docker Hub organization.

"select" is used by .github/workflows/build-images.yml. It prints a JSON list of
the images to build, each with a "checkTag" flag that says whether the build must
fail when the version tag already exists.
"""

import argparse
import json
import os
import subprocess
import sys

import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = "dockerbuild-config.yaml"
# Changes to these files rebuild every image on a pull request (without pushing),
# so that a change to the build itself is tested against every Dockerfile.
WORKFLOW_FILES = [".github/workflows/build-images.yml", "scripts/images.py"]


def load_config(text=None):
    if text is None:
        with open(os.path.join(REPO_ROOT, CONFIG_FILE), encoding="utf-8") as f:
            text = f.read()
    config = yaml.safe_load(text)
    names = [image["name"] for image in config["images"]]
    duplicates = sorted({n for n in names if names.count(n) > 1})
    if duplicates:
        sys.exit(f"Duplicate image names in {CONFIG_FILE}: {', '.join(duplicates)}")
    return config


def image_ref(config, image):
    return f"{config['organization']}/{image['name']}:{image['version']}"


def build_entry(config, image, check_tag):
    """The fields the workflow's build matrix needs for one image."""
    return {
        "name": image["name"],
        "version": str(image["version"]),
        "image": f"{config['organization']}/{image['name']}",
        "context": image["context"],
        "file": f"{image['context']}/{image['dockerfile']}",
        "platforms": image.get("platforms", config["platforms"]),
        "checkTag": check_tag,
    }


def git(*args):
    return subprocess.run(
        ["git", *args], cwd=REPO_ROOT, check=True, capture_output=True, text=True
    ).stdout


def changed_files(base, head):
    return [f for f in git("diff", "--name-only", base, head).splitlines() if f]


def base_config(base):
    """The config at the base commit, or None if it did not exist then."""
    try:
        return load_config(git("show", f"{base}:{CONFIG_FILE}"))
    except subprocess.CalledProcessError:
        return None


def is_under(path, prefix):
    return path == prefix or path.startswith(prefix.rstrip("/") + "/")


def select_changed(config, base, head, include_workflow):
    files = changed_files(base, head)
    old = base_config(base)
    old_images = {i["name"]: i for i in old["images"]} if old else None
    rebuild_all = include_workflow and any(f in WORKFLOW_FILES for f in files)

    selected = []
    for image in config["images"]:
        watched = image["paths"] + [f"{image['context']}/{image['dockerfile']}"]
        source_changed = any(is_under(f, p) for f in files for p in watched)
        # When the config file is first added there is nothing to compare with,
        # so only source changes count.
        entry_changed = old_images is not None and old_images.get(image["name"]) != image
        if source_changed or entry_changed:
            selected.append(build_entry(config, image, check_tag=True))
        elif rebuild_all:
            selected.append(build_entry(config, image, check_tag=False))
    return selected


def select_named(config, names):
    images = {i["name"]: i for i in config["images"]}
    if names.strip() == "all":
        wanted = list(images)
    else:
        wanted = [n.strip() for n in names.split(",") if n.strip()]
    unknown = [n for n in wanted if n not in images]
    if unknown:
        sys.exit(f"Unknown image(s): {', '.join(unknown)}")
    return [build_entry(config, images[n], check_tag=True) for n in wanted]


def find_images(config, names):
    images = {i["name"]: i for i in config["images"]}
    unknown = [n for n in names if n not in images]
    if unknown:
        sys.exit(f"Unknown image(s): {', '.join(unknown)}")
    return [images[n] for n in names] if names else config["images"]


def run(cmd, dry_run=False):
    print("+ " + " ".join(cmd), flush=True)
    if not dry_run:
        subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def cmd_list(config, args):
    for image in config["images"]:
        print(f"{image_ref(config, image):70} {image['context']}/{image['dockerfile']}")


def cmd_build(config, args):
    for image in find_images(config, args.names):
        entry = build_entry(config, image, check_tag=True)
        cmd = ["docker", "buildx", "build", "-t", image_ref(config, image), "-f", entry["file"]]
        if args.push:
            cmd += ["--platform", args.platforms or entry["platforms"], "--push"]
        else:
            # --load can only load a single platform into the local image store.
            cmd += (["--platform", args.platforms] if args.platforms else []) + ["--load"]
        run(cmd + [entry["context"]])


def cmd_republish(config, args):
    """Publish each image's current version in the organization.

    An image with "republishedFrom" is copied in the registry, so the new tag has
    exactly the same manifests (and architectures) as the old one. An image
    without it is built from source for every platform and pushed.
    """
    for image in find_images(config, args.names):
        source = image.get("republishedFrom")
        if source:
            run(["docker", "buildx", "imagetools", "create", "-t", image_ref(config, image), source],
                dry_run=args.dry_run)
        else:
            entry = build_entry(config, image, check_tag=True)
            run(["docker", "buildx", "build", "-t", image_ref(config, image), "-f", entry["file"],
                 "--platform", entry["platforms"], "--push", entry["context"]], dry_run=args.dry_run)


def cmd_select(config, args):
    if args.names:
        selected = select_named(config, args.names)
    else:
        if not (args.base and args.head):
            sys.exit("select needs --names, or both --base and --head")
        selected = select_changed(config, args.base, args.head, args.include_workflow)
    print(json.dumps(selected))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="list the images and their Dockerfiles")

    p = sub.add_parser("build", help="build images locally")
    p.add_argument("names", nargs="+")
    p.add_argument("--push", action="store_true", help="push to Docker Hub (multi-architecture)")
    p.add_argument("--platforms", help="override the platforms, e.g. linux/amd64")

    p = sub.add_parser("republish", help="copy (or build) every image into the organization")
    p.add_argument("names", nargs="*", help="images to copy (default: all)")
    p.add_argument("--dry-run", action="store_true")

    p = sub.add_parser("select", help="print the images to build as JSON (used by the workflow)")
    p.add_argument("--base")
    p.add_argument("--head")
    p.add_argument("--names", help="comma-separated image names, or 'all'")
    p.add_argument("--include-workflow", action="store_true",
                   help="rebuild every image when the build workflow or this script changed")

    args = parser.parse_args()
    config = load_config()
    {"list": cmd_list, "build": cmd_build, "republish": cmd_republish, "select": cmd_select}[args.command](config, args)


if __name__ == "__main__":
    main()
