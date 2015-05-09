# Data processing scripts

This directory contains the scripts that are used in the data pipeline for the DCKidsCount web app. 

* `fetch_acs.rb`: Download variables from the Census API and use them to construct aggregate variables.
* `crosswalk.rb`: Reads the output from `fetch_acs.rb` and produces a new file which is crosswalked to the DC neigborhood level

## Fetching data from the Census API

`fetch_acs.rb` is a program written in the [ruby](https://www.ruby-lang.org/en/) programming language.
