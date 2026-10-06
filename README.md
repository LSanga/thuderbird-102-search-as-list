# Search as List

Thunderbird add-on that shows global search results directly as a **message list**, instead of the default card view.

Basically it does the same thing as clicking the "Open as list" button, just automatically.

It's a rewrite of the old [Search as list](https://addons.thunderbird.net/thunderbird/addon/search-as-list/) add-on which only works on TB 60.

## Why Thunderbird 102?

102 is the last version before the big GUI revamp in 115 (Supernova). A bunch of people (me included) didn't like the new UI and are still on 102, so this add-on targets **102.x only**.

## Install

1. Download the `.xpi` from the [Releases](../../releases) page
2. In Thunderbird open Add-ons Manager → ⚙ → *Install Add-on From File...*
3. Pick the `.xpi`, done ✅

Disabling or removing the add-on restores the default faceted view, no restart needed.

## Build

```sh
./build.sh
```

This creates `search-as-list-<version>.xpi`.

## Known limitations

- Chat (IM) results are not shown in the list
- Empty searches still open the faceted view (nothing to list)
- Each new search opens a new tab (default Thunderbird behaviour)

## License

MIT, see [LICENSE](LICENSE)
