---
description: Installing Mission Control is super easy. Here's how.
---

# Installation

You can install Mission Control using NPM by running this command.

```bash
npm install -g @capevace/mission-control
```

{% hint style="info" %}
 Mission Control is only tested using Node version 14 and 15. You may need to check your version of Node.js if you encounter errors during installation.
{% endhint %}

Once you've done that, run mission-control so config, database and defaults can be generated.  
These can then be found in `~/.mission-control`.

```bash
$ mission-control
# Mission Control will now generate defaults and config in ~/.mission-control
```



