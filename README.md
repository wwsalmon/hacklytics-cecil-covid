<img width="100" alt="A syringe-shaped rocket doodle" src="https://user-images.githubusercontent.com/77285010/218306834-22f8b223-07a0-4804-a4a3-b89593177f9a.png"> 

# Hacklytics 2023: BoostOnTime! 
*Team Cecil Separated Values (Pomona College)*

## Try our tracker!

[https://boostontime.vercel.app/](https://boostontime.vercel.app/)

## Motivation

Do you ever wonder when to get your next COVD booster? Vaccine data is important to understand - but it's technical and  **inaccessible**. Our project aims to distill vaccine effectiveness studies into a personalized, data-driven, and user-friendly dashboard to help keep track of one's vaccination status. We hope that our tool enables users to make more informed decisions about their COVID vaccinations, while advocating for up-to-date immunization.

## Data processing
The raw data has multiple columns containing mixed datatypes, especially the time data. The time data are given in different units such as weeks or months and some are also given in intervals (e.g. 2-6 months, >14 weeks). As our project focuses on the vaccine effectiveness over time so as to remind users to take booster shots on time, we would like to quantify these string entries into numerical entries with a unit of days.

To ensure the accuracy of our visual display, we matched and eliminated the data entries that only provide an open interval (e.g. > 2 weeks), as it would not provide the most time-sensitive data point. For a closed interval (e.g. 8-10 days), we again used regex expressions to extract the upper and lower bounds. We then multiplied the numeros in the substring by 7 or 30 days if the substrings 'week' and 'month' are matched in these entries so as to convert them into units of days.

Similarly, we unified and filtered the data entries for dosage sequence, vaccine brand and represented groups. The processed data are then imported into the webapp.

## Technologies

We built a webapp using React and Express, driven by a MongoDB Atlas database backend. Using the database we were able to set up flexible user accounts using Google Cloud login, and allow users to store their personal vaccination history through an onboarding process, then feed this data into our model to calculate rates of protection against infection, severe illness, and death. Calculations from our model were displayed through a timeline visualization created from scratch using d3.js. Finally, the frontend and backend of the site were deployed on Vercel.

## Demo & Tutorial

[![Demo](https://user-images.githubusercontent.com/74080246/218319220-e852460c-6b93-4beb-93b7-b3590d187735.png)](https://www.youtube.com/watch?v=zQ6IfzK14h8)

## Future Plans & Applications
<img width="300" alt="A calendar doodle" src="https://user-images.githubusercontent.com/77285010/218306356-ead545bf-13ed-43a4-8e2c-909be0b865df.png">

* Incorporate data on immnunity after infection
* Get data on different vaccines, bivalent boosters, etc.
* Custom models for immunocompromized people, health care workers, and children.

## Boost it up!
Make safer COVID decisions by breaking down vaccine effectiveness to the day.

## Citations
Lin, Dan-Yu, et al. 2022. “Association of Primary and Booster Vaccination and Prior Infection with SARS-COV-2 Infection and Severe COVID-19 Outcomes.” JAMA, vol. 328, no. 14, 2022, p. 1415., https://doi.org/10.1001/jama.2022.17876.

Tseng, Hung Fu, et al. 2023. “Effectiveness of Mrna-1273 Vaccination against SARS-COV-2 Omicron Subvariants BA.1, Ba.2, Ba.2.12.1, Ba.4, and Ba.5.” Nature Communications, vol. 14, no. 1, 2023, https://doi.org/10.1038/s41467-023-35815-7.

Ferdinants, Jill M, et al. 2022. “Waning of Vaccine Effectiveness against Moderate and Severe COVID-19 among Adults in the US from the Vision Network: Test Negative, Case-Control Study.” BMJ, 2022, https://doi.org/10.1136/bmj-2022-072141.
