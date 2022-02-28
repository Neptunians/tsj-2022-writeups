# TSJ CTF 2022 write-up - Nimja at Nantou

![Banner](https://i.imgur.com/RO4lpJK.jpg)

This was the first edition of TSJ CTF and it was great!
There was a lot of hardcore Web Challenges, which 1 or 3 solves.
I did some progress in other web challenges, but solved only Nimja. 

Some hackers from our team broke 2 other pwns and we managed to get 22nd place among 82 teams, who made more than 110 points (Sanity + Questionnaire).

I'll also make an honorable mention to Genie, which I got obsessed with, but couldn't solve the crypto part, which I still dont know the solution.

## Nimja at Nantou

![Nimja](https://i.imgur.com/3N2CWme.png)

We got 3 Docker containers:
1. **proxy**: An [Apache Traffic Server](https://trafficserver.apache.org/) routing requests to the other services [2] and [3] - the only one directly acessible.
2. **hello-from-the-world**: A [Nim Language](https://nim-lang.org/) webapp that holds a key to get service information from [3].
4. **service-info**: A nodejs app the gives OS Service Information using the [systeminformation](https://www.npmjs.com/package/systeminformation) npm package.

## References
* CTF Time Event: https://ctftime.org/event/1512
* idekCTF: https://ctf.idek.team/
* idekCTF Discord: https://discord.gg/Rrhdvzn
* Repo with the artifacts discussed here: https://github.com/Neptunians/idekctf-2021-writeups
* UIUCTF 2021 - yana - Client-side exfiltration (Cache Probing): https://fireshellsecurity.team/uiuctf2021-yana/
* SSRF: https://portswigger.net/web-security/ssrf
* ssrf-req-filter: https://github.com/y-mehta/ssrf-req-filter
* Team: [FireShell](https://fireshellsecurity.team/)
* Team Twitter: [@fireshellst](https://twitter.com/fireshellst)
* Follow me too :) [@NeptunianHacks](https://twitter.com/NeptunianHacks) 