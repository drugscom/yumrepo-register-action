# Register new package builds to AWS SDB

This action registers new package builds to AWS SDB.

## Inputs

### `spec`

Path to the spec successfully built.

### `sdb-domain`

AWS SimpleDB domain. Default `"packages"`.

## Example usage

```yaml
uses: drugscom/yumrepo-register-action@v1
with:
  spec: curl/SPECS/curl.spec
```