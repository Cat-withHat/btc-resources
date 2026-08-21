# BTCMaxis.com

We're forking Lopps content to a new resource list at [https://btcmaxis.com](https://btcmaxis.com). I need help vetting it for Bitcoin maximalism and removing anything we wouldn't want to direct a noobie to, especially shitcoins, and add context and warnings on the occasions we feel it necessary they slip through.

You can help at [https://github.com/MrRGnome/btc-resources](https://github.com/MrRGnome/btc-resources) by going through the resources in bitcoin-information folder and removing/adding links and descriptions as necessary.

You can see a list of what has already been done and what needs doing here.
[https://github.com/MrRGnome/btc-resources/issues/5](https://github.com/MrRGnome/btc-resources/issues/5)

We organize in the [Bitcoin Discord](https://btcmaxis.com/discord). You can also make changes here via PR, or review content and suggest changes via github issues.

The actual website is published from the repo here https://btcmaxis.com/

There are so many resources to go through. All that's needed is to replace, remove, and add links as necessary. You don't need to know how to code to help. It's all HTML only work. Just review the content and submit a PR with (or tell us) what needs to change.

## Progress:

- Rearchitecture Static Site: Done
- [BTC Resources](https://github.com/MrRGnome/btc-resources/issues/5) - 100% complete
- [Lightning Resources](https://github.com/MrRGnome/btc-resources/issues/14) - 10% Done
- Articles System - 100% Done
- Search System - 100% Done
- Discord Integration - 75% Done

## Front Page Articles

The home page renders promoted articles from the external articles repository. The site will show an article on the front page when either the article JSON or its `articles.json` manifest entry has one of these truthy fields:

- `frontpage`
- `front_page`
- `frontPage`
- `featured`
- `promoted`
- `homepage`
- `home_page`
- `homePage`
- `pinned`

The site will also treat these timestamp fields as a front-page promotion signal and use them for sorting:

- `frontpage_at`
- `front_page_at`
- `frontPageAt`
- `featured_at`
- `featuredAt`
- `promoted_at`
- `promotedAt`
- `homepage_at`
- `home_page_at`
- `homePageAt`
- `pinned_at`
- `pinnedAt`

The manifest may alternatively include a root-level `frontpage`, `front_page`, `featured`, `promoted`, `homepage`, or `home_page` list/object keyed by article ID.
