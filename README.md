# ODA Reference Example Components — Helm Chart Repository

This branch (`gh-pages`) hosts the packaged Helm charts. For documentation, source code, and contribution guidelines, see the [main README on the master branch](https://github.com/tmforum-oda/reference-example-components/blob/master/README.md).

## Usage

```bash
helm repo add oda-components https://tmforum-oda.github.io/reference-example-components
helm repo update
```

Install a chart:

```bash
helm install <release-name> oda-components/<chart-name> -n components
```

Uninstall a chart:

```bash
helm delete <release-name> -n components
```
