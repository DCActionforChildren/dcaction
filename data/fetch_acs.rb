# encoding: UTF-8
# TODO: remove assumption that all ACS data is integral?

require 'json'
require 'open-uri'

API_KEY = '4578df5c991e1f7d74624f849bb5a1167d652b23'
BASE_URL = "http://api.census.gov/data/2011/acs5?key=#{API_KEY}"
GEO = 'for=tract:*&in=state:11'
TRACT_FILE = 'acs_tract_data.json'

# the following fields will be simply renamed from ACS

fields_rename = {
  'population_total' => 'B01003_001E',
  'population_under_18' => 'B09001_001E',
  'median_family_income' => 'B19013_001E',
  'single_mother_families' => 'B09002_015E',
  'children_in_poverty' => 'B17006_001E',
  'population_white_total' => 'B03002_003E',
  'population_black_total' => 'B03002_004E',
  'population_hisp_total' => 'B03002_012E',
  'poverty_numer' => 'B17001_002E',
  'poverty_denom' => 'B17001_001E',
  'poverty2_numer' => 'B17006_002E',
  'poverty2_denom' => 'B17006_001E'
}

# the following fields are sums of ACS fields

fields_sum = {
  'population_under_5' => [
    "B09001_005E",
    "B09001_004E",
    "B09001_003E"
  ],
  'population_other_total' => [
    'B03002_005E',
    'B03002_006E', 
    'B03002_007E',
    'B03002_008E',
    'B03002_009E',
    'B03002_010E',
    'B03002_011E'
  ],
  'white_under_18' => [
    'B01001H_003E',
    'B01001H_004E',
    'B01001H_005E',
    'B01001H_006E',
    'B01001H_018E',
    'B01001H_019E',
    'B01001H_020E',
    'B01001H_021E'
  ],
  'hispanic_under_18' => [
    'B01001I_003E',
    'B01001I_004E',
    'B01001I_005E',
    'B01001I_006E',
    'B01001I_018E',
    'B01001I_019E',
    'B01001I_020E',
    'B01001I_021E'
  ],
  'no_hs_degree_25_plus' => [
    'B15001_004E',
    'B15001_005E',
    'B15001_045E',
    'B15001_046E'
  ],
  'youth_ready_to_work_numer'  => [
    'B23001_007E',
    'B23001_014E',
    'B23001_021E',
    'B23001_093E',
    'B23001_100E',
    'B23001_107E'
  ],
  'youth_ready_to_work_denom' => [
    'B23001_006E',
    'B23001_013E',
    'B23001_020E',
    'B23001_092E',
    'B23001_099E',
    'B23001_106E'
  ]
}

# the following fields are computed by taking the first ACS field and subtracting the rest

fields_sub = {
  'white_18' => [
    'B01001H_001E',
    'B01001H_003E',
    'B01001H_004E',
    'B01001H_005E',
    'B01001H_006E',
    'B01001H_018E',
    'B01001H_019E',
    'B01001H_020E',
    'B01001H_021E'
  ],
  'hispanic_18' => [
    'B01001I_001E',
    'B01001I_003E',
    'B01001I_004E',
    'B01001I_005E',
    'B01001I_006E',
    'B01001I_018E',
    'B01001I_019E',
    'B01001I_020E',
    'B01001I_021E'
  ],
  'no_hs_degree_18_24' => [
    'B15001_001E',
    'B15001_004E',
    'B15001_005E',
    'B15001_045E',
    'B15001_046E'
  ]
}

# We can only pull 50 fields at a time from the Census API so I'm going to get
# the fields in fields_rename and fields_sum first.
# TODO it would make more sense to download the fields in increments of 50,
# accumulate them into a single array of arrays, and then create our variables
# in a single loop

# build the get-string for renamed and subtracted fields

all_acs_fields = (fields_rename.values + fields_sub.values).flatten.uniq

#Change all the Es to Ms to get the margins of error.

all_acs_errors = all_acs_fields.map do |ff|
  ff.sub("E", "M")
end

url = [BASE_URL, "get=" + all_acs_fields.join(','), GEO].join('&')
url_e = [BASE_URL, "get=" + all_acs_errors.join(','), GEO].join('&')

# get the response, the first element in the response is the column names

puts "Fetching #{all_acs_fields.length} fields from ACS..."
puts "URL: #{url}"
resp = JSON.parse open(url).read
colnames, *data = *resp

puts "Fetching #{all_acs_errors.length} margins of error from ACS..."
puts "URL: #{url_e}"
resp_e = JSON.parse open(url_e).read
colnames_e, *data_e = *resp_e

# build a hash of values keyed by tract name

tracts = {}

data.zip(data_e).each do |row|
  acsrow = Hash[colnames.zip row[0]]
  acsrow_e = Hash[colnames.zip row[1]]
  outrow = {}

  fields_rename.each do |outname, acsname|
    outrow[outname] = acsrow[acsname].to_i
    outrow[outname+"_margin"] = acsrow_e[acsname].to_i
  end

  fields_sub.each do |outname, acsfields|
    first, *rest = *acsfields
    outrow[outname] = acsrow[first].to_i
    outrow[outname+"_margin"] = (acsrow_e[first].to_i/1.645)**2

    rest.each do |acsname|
      outrow[outname] -= acsrow[acsname].to_i
      outrow[outname+"_margin"] += (acsrow_e[acsname].to_i/1.645)**2 #Yes, +=. Using other data elmts may give us a smaller MoE by the sum-of-squares methods.
    end
    outrow[outname+"_margin"] = Math.sqrt(outrow[outname+"_margin"])*1.645
  end

  # tract ids in the neighborhood file include the state and county number
  tracts['11001' + acsrow['tract']] = outrow
end

# build the get-string for summed fields

all_acs_fields = fields_sum.values.flatten.uniq

#Change all the Es to Ms to get the margins of error.

all_acs_errors = all_acs_fields.map do |ff|
  ff.sub("E", "M")
end

url = [BASE_URL, "get=" + all_acs_fields.join(','), GEO].join('&')
url_e = [BASE_URL, "get=" + all_acs_errors.join(','), GEO].join('&')

# get the response, the first element in the response is the column names

puts "Fetching #{all_acs_fields.length} fields from ACS..."
puts "URL: #{url}"
resp = JSON.parse open(url).read
colnames, *data = *resp

puts "Fetching #{all_acs_errors.length} margins of error from ACS..."
puts "URL: #{url_e}"
resp_e = JSON.parse open(url_e).read
colnames_e, *data_e = *resp_e

data.zip(data_e).each do |row|
  acsrow = Hash[colnames.zip row[0]]
  acsrow_e = Hash[colnames.zip row[1]]
  outrow = {}

  # We found some Census documentation suggesting that we use the sqrt(sum of squares) for
  # the margin of error for aggregate estimates.
  # https://www.census.gov/acs/www/Downloads/data_documentation/Statistical_Testing/ACS_2008_Statistical_Testing.pdf
  # So that's what I'm doing here.
  fields_sum.each do |outname, acsfields|
    outrow[outname] = 0
    outrow[outname+"_margin"] = 0

    acsfields.each do |acsname|
      outrow[outname] += acsrow[acsname].to_i
      outrow[outname+"_margin"] += (acsrow_e[acsname].to_i/1.645)**2
    end
    outrow[outname+"_margin"] = Math.sqrt(outrow[outname+"_margin"])*1.645
  end

  tracts['11001' + acsrow['tract']].merge! outrow
end

# write the result to a json file

File.open(TRACT_FILE, 'w') do |f|
  f.puts JSON.pretty_generate(tracts)
end
