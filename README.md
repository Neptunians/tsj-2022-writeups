# TSJ CTF 2022 write-up - Nimja at Nantou

![Banner](https://i.imgur.com/RO4lpJK.jpg)

This was the first edition of TSJ CTF and it was great!
There was a lot of hardcore Web Challenges, which 1 or 3 solves.
I did some progress in other web challenges, but solved only Nimja. 

Some hackers from our team broke 2 other pwns and we managed to get 22nd place among 82 teams, who made more than 110 points (Sanity + Questionnaire).

I'll also make an honorable mention to **Genie**, which I got obsessed with, but couldn't solve the crypto part, which I still dont know the solution while writing this.

## Nimja at Nantou

![Nimja](https://i.imgur.com/3N2CWme.png)

We got 3 Docker containers:
1. **proxy**: An [Apache Traffic Server](https://trafficserver.apache.org/) routing requests to the other services [2] and [3] - the only one directly acessible.
2. **hello-from-the-world**: A [Nim Language](https://nim-lang.org/) webapp that holds a key to get service information from [3].
4. **service-info**: A nodejs app the gives OS Service Information using the [systeminformation](https://www.npmjs.com/package/systeminformation) npm package.

![Diagram](https://i.imgur.com/a9k5a8A.png)

We also get a docker-compose file to easily start the challenge locally.

![docker-compose](https://i.imgur.com/Yed8D69.png)

### Architecture and Source

I think expanding the diagram will make it easier to understand the scenario.

![Expanded Diagram](https://i.imgur.com/iz6aYGR.png)


## References
* CTF Time Event: https://ctftime.org/event/1547
* TSJ CTF: https://chal.ctf.tsj.tw/
* TSJ CTF Discord: https://discord.gg/u6taYEWGfr
* Repo with the artifacts discussed here: https://github.com/Neptunians/tsj-2022-writeups
* Team: [FireShell](https://fireshellsecurity.team/)
* Team Twitter: [@fireshellst](https://twitter.com/fireshellst)
* Follow me too :) [@NeptunianHacks](https://twitter.com/NeptunianHacks) 