<img width="100" alt="bullet" src="https://user-images.githubusercontent.com/77285010/218306834-22f8b223-07a0-4804-a4a3-b89593177f9a.png"> 

# Hacklytics project: COVID vaccine effectiveness tracker - BoostOnTime!

Team *Cecil Separated Values (Pomona College)*

> Please reorder and rename these titles and delete my silly comments before submitting thx

## Motivation

Lorem Ipsum

## Project structure

## Data source

## Data processing
The raw data has multiple columns containing mixed datatypes, especially the time data. The time data are given in different units such as weeks or months and some are also given in intervals (e.g. 2-6 months, >14 weeks). As our project focuses on the vaccine effectiveness over time so as to remind users to take booster shots on time, we would like to quantify these string entries into numerical entries with a unit of days.

To ensure the accuracy of our visual display, we matched and eliminated the data entries that only provide an open interval (e.g. > 2 weeks), as it would not provide the most time-sensitive data point. For a closed interval (e.g. 8-10 days), we again used regex expressions to extract the upper and lower bounds. We then multiplied the numeros in the substring by 7 or 30 days if the substrings 'week' and 'month' are matched in these entries so as to convert them into units of days.

Similarly, we unified and filtered the data entries for dosage sequence, vaccine brand and represented groups. The processed data are then imported into the webapp.

## <@samson maybe you could write some more sections about web dev?>

## Demo & 1-minute tutorial

> Maybe we can even plug the video link here.

## Future Plans & Applications
<img width="740" alt="calendar" src="https://user-images.githubusercontent.com/77285010/218306356-ead545bf-13ed-43a4-8e2c-909be0b865df.png">


## Boost it up!
> idk why I made this section, maybe just put in some whitty catch phrases
