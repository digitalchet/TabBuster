# TabBuster

**Your browser. Your tabs. Your call.**

TabBuster automatically closes pages you have decided should stop appearing. Add a page or an entire hostname to your list, and let it handle the repeat appearances.

Some helpful browser companions are remarkably persistent about reminding you to update an already updated browser. One was particularly inspirational. Names withheld; tabs dismissed.

## Get started

1. Choose **Code → Download ZIP** on GitHub, extract it, and keep the files in a permanent folder.
2. Open `chrome://extensions` in Chrome or `opera://extensions` in Opera/GX.
3. Enable **Developer mode**, choose **Load unpacked**, and select the inner **TabBuster** folder containing `manifest.json`.
4. Pin TabBuster to your toolbar for easy access.

To update, replace the files in the same folder and click **Reload** on the extension's card.

## Make yourself comfortable

- **Add this tab/site** saves the current page. Use the arrow to cover its whole hostname, or enter a URL in **Options**.
- **Close current tab** dismisses it immediately when adding. **Pause automatic closing** gives you a break without losing your list.
- See total and session closure counts, recent closures, and optional milestone celebrations.
- Enable **In-browser notifications** in Settings and approve website access for brief page notices. Windows notifications remain available without that access and on protected pages.

Page rules ignore query strings and fragments. Subdomains, including `www`, need separate entries. The **? Help** button in Settings explains the details.

## Good to know

Matching pages close even when opened deliberately; pause before revisiting one. A tab may briefly appear or begin loading before it closes. TabBuster follows your list—it does not assess whether a site is safe.

Rules, preferences, counts and recent closure history stay on your device. No analytics, remote code or background network requests. Removing the extension clears its saved data.

## Development

Run `npm test` with Node.js 18 or later. The tests use simulated browser APIs and require no dependencies; browser installation needs no build step.

[A Digital*Impulse Creation.](https://digital-impulse.com/) · [Buy me a coffee](https://ko-fi.com/digitalchet)
