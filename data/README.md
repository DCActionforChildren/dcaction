# Data collection scripts (`fetch_acs.rb` and `crosswalk.rb`)

This directory contains two ruby scripts that are used to download ACS data using the Census API
and to crosswalk that data to the neighborhood level.

## Dependencies

These scripts were developed using ruby 2.

`crosswalk.rb` depends on the `json` and `RubyXL` gems. In addition, the crosswalk script reads in
an Excel file to determine how to assign tracts to neighborhoods. This file was obtained from the
DC government -- if the format of the file changes it could break the script.

## `fetch_acs.rb`

Most of the variables we're interested in -- like the population under 5 or Hispanic population
over 18 -- do not correspond to a single ACS variable. Instead, they need to be computed (e.g., by
summing up several ACS variables). `fetch_acs.rb` allows you to define variables of interest and
download them to a json file.

Variables are created in three ways: renaming an ACS variable, summing a list of ACS variables,
and subtracting a list of ACS variables from another ACS variable. You can also specify that a
variable should be computed as a ratio in the crosswalk script.

### constants

The following constants are defined at the top of the script:

* `API_KEY`: A Census API key, available at
  [http://www.census.gov/developers/tos/key_request.html](http://www.census.gov/developers/tos/key_request.html)
* `BASE_URL`: The URL for accessing the Census API. The year in the URL can be updated as new data
  becomes available.
* `GEO`: The geography we want to download data for. See the Census API docs for more
  information.  For our purposes, we want all tracts in Washington, DC (the District has state
  code 11 in the Census API).
# `TRACT_FILE`: The name of the output file.

### renamed variables

Use the `fields_rename` hash to create a variable by renaming an ACS variable. Entries in the hash
should be of the form

    new_var_name => acs_var_code

For example

    'population_total' => 'B01003_001E'

This will create an output variable named `population_total` which is equal to the ACS variable
with code `B01003_001E`.

### summed variables

Use the `fields_sum` hash to create a variable by summing a list of ACS variables. Entries in the
hash should be of the form

    new_var_name => [acs_var_code_1, acs_var_code_2, ... ]

For example

    'no_hs_degree_18_24_numer' => [
      'B15001_004E',
      'B15001_005E',
      'B15001_045E',
      'B15001_046E'
    ]

This will create an output variable named `no_hs_degree_18_24_numer` whose value is equal to the
sum of the ACS variables `B15001_004E`, `B15001_005E`, `B15001_045E`, and `B15001_046E`. That is, 

    no_hs_degree_18_24_numer = B15001_004E + B15001_005E + B15001_045E + B15001_046E

in the output.

### differenced variables

Use the `fields_sub` hash to create a variable by subtracting a sum of ACS variables from another
ACS variable. Entries in the hash should be of the form

    new_var_name => [acs_var_code_1, acs_var_code_2, ... ]

The first variable that appears in the list is special, because the remaining variables will be
subtracted form it. For example

    'example' => [
      'B01001H_001E',
      'B01001H_003E',
      'B01001H_004E',
      'B01001H_005E',
    ]

This will create an output variable named `example` whose value is equal to the ACS variable
`B01001H_001E` minus the sum of the ACS variables `B01001H_003E`, `B01001H_004E`, and `B01001H_005E`.  In other words

    example = B01001H_001E - (`B01001H_003E` + `B01001H_004E` + `B01001H_005E`)

### computing ratios in `crosswalk.rb`

You can also specify that certain variables should be computed as a ratio in `crosswalk.rb`. The
reason ratios are computed in `crosswalk.rb` instead of here is that numerators and denominators
need to be aggregated for a neighborhood before we do the division as a final step.

To specify a ratio you must create a pair of output variables suffixed in `_numer` and `_denom`.
For example, to create a neighborhood variable named `my_ratio` you must create variables named
`my_ratio_numer` and `my_ratio_denom`. Both numerator and denominator can be renamed, summed, or
differenced from ACS variables.


## `crosswalk.rb`

`crosswalk.rb` reads the output from `fetch_acs.rb` and a spreadsheet defining DC neighborhoods
and creates a CSV file with neighborhood-level data.

### constants

`crosswalk.rb` defines the following constants.

* `CROSSWALK_FILE`: the name of the Excel spreadsheet with mappings from Census tracts to DC
  neighborhoods.
* `TRACT_FILE`: the name of the json file containing tract-level data. This should match the
  `TRACT_FILE` constant in `fetch_acs.rb`. 
* `NBHD_FILE`: the name of the output file.

### averaged fields

By default, `crosswalk.rb` creates weighted sums of tract-level variables. If instead you want to
calculate a weighted average of tract-level data, add the name of the variable to be averaged to the `averaged_fields` array.


# next steps

## new generic crosswalk file

We want to build a new crosswalk file that will replace crosswalk.rb but will be more generic.

Input:
* data file in csv or json
* mapping file in csv with three columns: old geo id, new geo id, fraction of old geo contained in new geo
* command line arguments:
    * data file type
    * column name for old geo id (optional, use name from crosswalk file if none specified)
    * output file name, output column name

Output:
* merged file with the same data variables and the new geo ID

Wish liest:
* checking the margin of error calculations at each step of the data update process (including in the fetch_acs script)

## coding latitude and longitude

* Polish the exist script
* it also needs to take generic inputs and outputs
* add functionality to geocode addresses
