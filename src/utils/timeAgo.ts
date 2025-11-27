import { translate } from "./translate";

export const timeAgo = (timestamp: number, ln: "en" | "fa") => {
    const t = translate(ln)!

    if (!timestamp) return "...";
    const diff = Date.now() - timestamp;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}${t["s ago"]}`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}${t["m ago"]}`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}${t["h ago"]}`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
};