# Wikiless

[wikiless.org](https://wikiless.org)

A free open source alternative Wikipedia front-end focused on privacy.

* No JavaScript or ads.
* All requests go through the backend, client never talks to Wikipedia.
* Prevents Wikipedia getting your IP address.
* Self-hostable. Anyone can setup a private or public instance.

XMR: 832ogRwuoSs2JGYg7wJTqshidK7dErgNdfpenQ9dzMghNXQTJRby1xGbqC3gW3GAifRM9E84J91VdMZRjoSJ32nkAZnaCEj

## Instances

[https://wikiless.org](https://wikiless.org) - Official instance

Community instances:
  - [https://wikiless.alefvanoon.xyz](https://wikiless.alefvanoon.xyz)
  - [https://wikiless.sethforprivacy.com](https://wikiless.sethforprivacy.com) + [hidden server](http://dj2tbh2nqfxyfmvq33cjmhuw7nb6am7thzd3zsjvizeqf374fixbrxyd.onion)
  - [https://wiki.604kph.xyz](https://wiki.604kph.xyz)
  - [https://wikiless.lunar.icu](https://wikiless.lunar.icu)
  - [https://wiki.froth.zone](https://wiki.froth.zone)
  - [https://wikiless.esmailelbob.xyz/](https://wikiless.esmailelbob.xyz/)
  - [https://wikiless.northboot.xyz](https://wikiless.northboot.xyz) + [hidden server](http://ybgg2evrcdz37y2qes23ff3wjqjdn33tthgoagi76vhxytu4mpxiz5qd.onion) + [I2P](http://wikiless.i2p)
  - [https://wikiless.tiekoetter.com](https://wikiless.tiekoetter.com)
  - [http://c2pese...onion](http://c2pesewpalbi6lbfc5hf53q4g3ovnxe4s7tfa6k2aqkf7jd7a7dlz5ad.onion) + [http://hflqp2...b32.i2p](http://hflqp2ejxygpj6cdwo3ogfieqmxw3b56w7dblt7bor2ltwk6kcfa.b32.i2p)

## TODO

* Make the mobile version better

## Why I should use Wikiless instead of Wikipedia?

There are couple of reasons why you might want to use Wikiless:

* Circumvent censorship (1)
* You prevent Wikipedia getting your IP address (2)

### 1: Circumvent censorship

Many countries have censored Wikipedia pages, including China, France, Germany, Iran, Russia... https://wikiless.org/wiki/Censorship_of_Wikipedia?lang=en


### 2: What's the problem of Wikipedia getting my IP address?

**Short:** If you trust that Wikipedia has not been infiltrated and/or you don't trust the Wikiless instance you would use, then you probably want to keep using Wikipedia instead of Wikiless because there are nothing to worry about giving your IP address to Wikipedia.

**Long:** We know from the leaks by Edward Snowden that the U.S. National Security Agency (NSA) has identified Wikipedia as a target for surveillance already in 2009.\[1\]\[2\] Wikimedia filled a lawsuit against the NSA in 2015 in order to fight against the mass-surveillance done by the NSA.\[2\]\[3\]

Some points from the lawsuit legal documents:

* Wikimedia hired a full-time Traffic Security Engineer who is responsible for implementing and maintaining technical efforts to protect its users' reading and editing habits from mass surveillance-including, specifically, from the NSA's surveillance.[4]
* Wikimedia transitioned to HTTPS-by-default primarily due to NSA's surveillance.[5]

One of the documents revealed by Snowden shows that both Wikipedia and Wikimedia has been listed as a so-called "Appid" in the XKeyscore – a program that covers "nearly everything a typical user does on the internet" – to identify web traffic, meaning that wiki related web traffic is something that NSA finds valuable.[6]

Jimmy Wales, Founder of Wikipedia, and Lila Tretikov, former Executive Director of the Wikimedia Foundation, has stated that, “[t]hese activities [viewing and editing Wikipedia articles] are sensitive and private: They can reveal everything from a person’s political and religious beliefs to sexual orientation and medical conditions.”[7]

Is it a far fetched idea that given the importance of the data what NSA (or other malicious actors) might gain from Wikipedia, that they haven't been able to infiltrate Wikipedia's servers in some way or another in the last 12 years? I don't think so. That's why I created Wikiless.


Non-Wikipedia related fun facts about the NSA:
* NSA pushed for the adoption of the Dual EC DRBG encryption standard which contained a backdoor deliberately inserted by themselves. The backdoor would have allowed NSA to decrypt for example SSL/TLS encryption which used Dual_EC_DRBG as a CSPRNG.[8][9]
* NSA spends $250 million per year to insert backdoors in software and hardware.[10][11]
* NSA classifies Linux Journal readers, Tor and Tails users as "extremists".[12]
* NSA intercepts routers, servers and other network hardware being shipped to organizations targeted for surveillance and install covert implant firmware onto them before they are delivered.[13]
* NSA has spied extensively on the European Union, the United Nations and numerous governments including allies and trading partners in Europe, South America and Asia.[14][15]
* “For the past decade, N.S.A. has led an aggressive, multipronged effort to break widely used Internet encryption technologies,” said a 2010 memo describing a briefing about N.S.A. accomplishments for employees of its British counterpart, Government Communications Headquarters, or GCHQ. “Cryptanalytic capabilities are now coming online. Vast amounts of encrypted Internet data which have up till now been discarded are now exploitable.”[16]
* At Microsoft, the NSA worked with company officials to get pre-encryption access to Microsoft’s most popular services, including Outlook e-mail, Skype Internet phone calls and chats, and SkyDrive, the company’s cloud storage service.[16]
* NSA has contacted Linus Torvalds with a request to add backdoors into Linux.[17]
* Under the PRISM program, which started in 2007, NSA gathers Internet communications from foreign targets from nine major U.S. Internet-based communication service providers: Microsoft, Yahoo, Google, Facebook, PalTalk, AOL, Skype, YouTube and Apple. Data gathered include email, videos, photos, VoIP chats such as Skype, and file transfers.[18]
* NSA is cooperating with 'third party' countries which tap into fiber optic cables carrying the majority of the world's electronic communications and are secretly allowing the NSA to install surveillance equipment on these fiber-optic cables. The foreign partners of the NSA turn massive amounts of data like the content of phone calls, faxes, e-mails, internet chats, data from virtual private networks, and calls made using Voice over IP software like Skype over to the NSA. In return these partners receive access to the NSA's sophisticated surveillance equipment so that they too can spy on the mass of data that flows in and out of their territory. Among the partners participating in the NSA mass surveillance program are Austria, Belgium, Denmark, Finland, Sweden and Spain.[19][20]
* GCHQ, with aid from the NSA, intercepted and stored the webcam images of millions of internet users not suspected of wrongdoing. The surveillance program codenamed Optic Nerve collected still images of Yahoo webcam chats (one image every five minutes) in bulk and saved them to agency databases.[21]
* The NSA has built an infrastructure which enables it to covertly hack into computers on a mass scale by using automated systems that reduce the level of human oversight in the process. The NSA relies on an automated system codenamed TURBINE which in essence enables the automated management and control of a large network of implants (a form of remotely transmitted malware on selected individual computer devices or in bulk on tens of thousands of devices). As quoted by The Intercept, TURBINE is designed to "allow the current implant network to scale to large size (millions of implants) by creating a system that does automated control implants by groups instead of individually."[22][23]
* NSA "hunts" system administrators. The Intercept published a document of an NSA employee discussing how to build a database of IP addresses, webmail, and Facebook accounts associated with system administrators so that the NSA can gain access to the networks and systems they administer.[24][25]
* Angela Merkel has compared NSA to Stasi.[26]

If you are like me, and you also like the NSA, feel free to contribute and add more fun facts!



#### Sources
  
\[1\]: https://www.aclu.org/files/natsec/nsa/20140722/Why%20Are%20We%20Interested%20in%20HTTP.pdf  
\[2\]: https://www.nytimes.com/2015/03/10/opinion/stop-spying-on-wikipedia-users.html  
\[3\]: https://policy.wikimedia.org/stopsurveillance/  
[4]: page 356 https://www.aclu.org/legal-document/wikimedia-v-nsa-joint-appendix-vol-6-7  
[5]: page 355 https://www.aclu.org/legal-document/wikimedia-v-nsa-joint-appendix-vol-6-7  
[6]: see slide #9 "Fingerprints and Appids (more)" https://www.aclu.org/sites/default/files/field_document/168-34.ex_.30.pdf  
[7]: https://archive.is/69f7s  
[8]: https://en.wikipedia.org/wiki/Dual_EC_DRBG  
[9]: https://archive.is/9TmLJ  
[10]: https://archive.nytimes.com/www.nytimes.com/interactive/2013/09/05/us/documents-reveal-nsa-campaign-against-encryption.html  
[11]: https://www.propublica.org/article/the-nsas-secret-campaign-to-crack-undermine-internet-encryption  
[12]: https://www.techspot.com/news/57316-nsa-classifies-linux-journal-readers-tor-and-tails-linux-users-as-extremists.html  
[13]: https://arstechnica.com/tech-policy/2014/05/photos-of-an-nsa-upgrade-factory-show-cisco-router-getting-implant/  
[14]: https://www.spiegel.de/netzwelt/netzpolitik/nsa-hat-wanzen-in-eu-gebaeuden-installiert-a-908515.html  
[15]: https://www.spiegel.de/politik/ausland/nsa-hoerte-zentrale-der-vereinte-nationen-in-new-york-ab-a-918421.html  
[16]: https://www.nytimes.com/2013/09/06/us/nsa-foils-much-internet-encryption.html  
[17]: https://archive.is/rMNnF  
[18]: https://www.theguardian.com/world/2013/jun/06/us-tech-giants-nsa-data  
[19]: https://www.information.dk/udland/2014/06/nsa-third-party-partners-tap-the-internet-backbone-in-global-surveillance-program  
[20]: https://en.wikipedia.org/wiki/RAMPART-A  
[21]: https://www.theguardian.com/world/2014/feb/27/gchq-nsa-webcam-images-internet-yahoo  
[22]: https://theintercept.com/2014/03/12/nsa-plans-infect-millions-computers-malware/  
[23]: https://en.wikipedia.org/wiki/TURBINE_(US_government_project)  
[24]: https://web.archive.org/web/20140411054544/https://firstlook.org/theintercept/article/2014/03/20/inside-nsa-secret-efforts-hunt-hack-system-administrators/  
[25]: https://theintercept.com/document/2014/03/20/hunt-sys-admins/  
[26]: https://www.theguardian.com/world/2013/dec/17/merkel-compares-nsa-stasi-obama  


## Installation

### Manual

1. Install [Node.js](https://nodejs.org).

1. Install [redis-server](https://redis.io).

   ```console
   # Linux, for example with Debian based systems
   apt install redis-server

   # macOS
   brew install redis
   ```

1. Clone and set up the repository.

   ```console
   git clone https://codeberg.org/orenom/wikiless
   cd wikiless
   npm install --no-optional
   cp config.js.template config.js # edit the file to suit your environment
   redis-server
   npm start
   ```

Wikiless should now be running at <http://localhost:8080>.

### Docker & docker compose

You can build a production image by running `docker build .` in the repo's root.

For development, there's a `docker-compose.yml` that mounts the app code (for hot reload of code changes) and default config. Before running it, you need to install the dependencies:

```
$ docker-compose run --rm web npm install --no-optionals
$ docker-compose up
```

If you are experiencing errors with Redis not connecting, you might want to try the [alternative docker-compose.yml](https://github.com/JarbasAl/wikiless-docker).
