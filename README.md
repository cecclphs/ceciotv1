# CEC IoT System 2018 (V1)

## Disclaimer

> This project was made back when I had beginners knowledge of NodeJS, thus looking back now this code is really really terrible. Thus please use this as a reference only and never use it again. V2 of this project is already under development with proper server support.

## Motivation

This was to control our Creative Electronics Club Makerspace lights using the Google Home we had at the time, it has been my goal ever since I enter the club so when I finally made it it was a dream come true(although with terrible code). 

## Security Flaws

For any laymans who didn't notice(thankfully), this system allowed people to enter the door by just a simple API call to the server, **WITHOUT AUTHENTICATION**, luckily, no one smart enough noticed and nothing was stolen :) Apart from that, our lights API was also exposed so well :) nothing bad happened alas. 

## Issues

1. Within 24 hours of initial installation, the system restarted and turned on all the lights for an entire night, causing the School to panic and warn us. :(

2. Shortly, the script wasn't stable enough to handle the unstable school internet, increasing the downtime of the system.

3. The unstable internet caused the express server to constantly to the point where a manual restart had to be done, which led to many awkward moments where members couldn't enter because the website wasn't working.

4. At the end of its lifecycle, the script started overwriting itself for some reason, meaning if the system restarted it would be blank. Then the state file last_state.json also kept being overwritten and blanked, basically everything slowly fell apart after 2 years of service.
