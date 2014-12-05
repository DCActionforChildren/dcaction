# encoding: UTF-8
# TODO: remove assumption that all ACS data is integral?

require 'json'
require 'open-uri'

API_KEY = '4578df5c991e1f7d74624f849bb5a1167d652b23'
BASE_URL = "http://api.census.gov/data/2013/acs5?key=#{API_KEY}"
GEO = 'for=tract:*&in=state:11'
TRACT_FILE = 'acs_tract_data.json'

# the following fields will be simply renamed from ACS

fields_rename = {
  'population_total' => 'B01003_001E',
  'population_under_18' => 'B09001_001E',
  'median_family_income_denom' => 'B00002_001E',
  'single_mother_families' => 'B09002_015E',
  'population_white_total' => 'B03002_003E',
  'population_black_total' => 'B03002_004E',
  'population_hisp_total' => 'B03002_012E',
  'total_neighborhood_poverty_numer' => 'B17001_002E',
  'total_neighborhood_poverty_denom' => 'B17001_001E',
  'homeownership_denom' => 'B11012_001E',
  'work_denom' => 'B08303_001E',
  'population_under_3' => 'B09001_003E'
}

# the following fields are sums of ACS fields

fields_sum = {
  'population_under_5' => [
    "B09001_004E",
    "B09001_003E"
  ],
  'poverty_under_5' => [
    "B17001_004E",
    "B17001_018E"
  ],
  'children_in_poverty_numer' => [
    "B17001_004E",
    "B17001_005E",
    "B17001_006E",
    "B17001_007E",
    "B17001_008E",
    "B17001_009E",
    "B17001_018E",
    "B17001_019E",
    "B17001_020E",
    "B17001_021E",
    "B17001_022E",
    "B17001_023E"
  ],
  'children_in_poverty_denom' => [
     "B17001_033E",
     "B17001_034E",
     "B17001_035E",
     "B17001_036E",
     "B17001_037E",
     "B17001_038E",
     "B17001_047E",
     "B17001_048E",
     "B17001_049E",
     "B17001_050E",
     "B17001_051E",
     "B17001_052E", 
     "B17001_004E",
     "B17001_005E",
     "B17001_006E",
     "B17001_007E",
     "B17001_008E",
     "B17001_009E",
     "B17001_018E",
     "B17001_019E",
     "B17001_020E",
     "B17001_021E",
     "B17001_022E",
     "B17001_023E"
  ],
  'population_other_total' => [
    'B03002_005E',
    'B03002_006E', 
    'B03002_007E',
    'B03002_008E',
    'B03002_009E',
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
  'black_under_18' => [
    'B01001B_003E',
    'B01001B_004E',
    'B01001B_005E',
    'B01001B_006E',
    'B01001B_018E',
    'B01001B_019E',
    'B01001B_020E',
    'B01001B_021E'
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
  'no_hs_degree_25_plus_numer' => [
    'B15001_012E',
    'B15001_013E',
    'B15001_020E',
    'B15001_021E',
    'B15001_028E',
    'B15001_029E',
    'B15001_036E',
    'B15001_037E',
    'B15001_053E',
    'B15001_054E',
    'B15001_061E',
    'B15001_062E',
    'B15001_069E',
    'B15001_070E',
    'B15001_077E',
    'B15001_078E'
  ],
  'no_hs_degree_18_24_numer' => [
    'B15001_004E',
    'B15001_005E',
    'B15001_045E',
    'B15001_046E'
  ],
  'no_hs_degree_18_24_denom' => [
    'B15001_003E',
    'B15001_044E'
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
  ],
  'homeownership_numer' => [
    'B11012_004E',
    'B11012_008E',
    'B11012_011E',
    'B11012_014E'
  ],
  'work_numer' => [
    'B08303_012E', 
    'B08303_013E'
  ],
  'no_hs_degree_25_plus_denom' => [
    'B15001_011E',
    'B15001_019E',
    'B15001_027E',
    'B15001_035E',
    'B15001_052E',
    'B15001_060E',
    'B15001_068E',
    'B15001_076E'
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
  'black_18' => [
    'B01001B_001E',
    'B01001B_003E',
    'B01001B_004E',
    'B01001B_005E',
    'B01001B_006E',
    'B01001B_018E',
    'B01001B_019E',
    'B01001B_020E',
    'B01001B_021E'
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
  'other_18' => [
    'B09001_001E',
    'B01001B_003E',
    'B01001B_004E',
    'B01001B_005E',
    'B01001B_006E',
    'B01001B_018E',
    'B01001B_019E',
    'B01001B_020E',
    'B01001B_021E',
    'B01001H_003E',
    'B01001H_004E',
    'B01001H_005E',
    'B01001H_006E',
    'B01001H_018E',
    'B01001H_019E',
    'B01001H_020E',
    'B01001H_021E',
    'B01001I_003E',
    'B01001I_004E',
    'B01001I_005E',
    'B01001I_006E',
    'B01001I_018E',
    'B01001I_019E',
    'B01001I_020E',
    'B01001I_021E'
  ],
  'other_under_18' => [
    'B09001_001E',
    'B01001I_003E',
    'B01001I_004E',
    'B01001I_005E',
    'B01001I_006E',
    'B01001I_018E',
    'B01001I_019E',
    'B01001I_020E',
    'B01001I_021E',
    'B01001B_003E',
    'B01001B_004E',
    'B01001B_005E',
    'B01001B_006E',
    'B01001B_018E',
    'B01001B_019E',
    'B01001B_020E',
    'B01001B_021E',
    'B01001H_003E',
    'B01001H_004E',
    'B01001H_005E',
    'B01001H_006E',
    'B01001H_018E',
    'B01001H_019E',
    'B01001H_020E',
    'B01001H_021E'
  ],
  # 'no_hs_degree_25_plus_denom' => [
  #   'B15001_001E',
  #   'B15001_003E',
  #   'B15001_044E'
  # ]
}

# The following fields are products of ACS fields

fields_prod = {
  'median_family_income_numer' => ['B19119_001E', 'B00002_001E']
}

# This function performs the Census API query. It returns a hash of hashes of the form
#     { tract1 => {var1 => val11, var2 => val12, ... },
#       tract2 => {var1 => val12, var2 => val22, ... }, ... }
#
def census_query(vars)
  tracts = {}
  vars.each_slice(50) do |v|
    url = [BASE_URL, 'get=' + v.join(','), GEO].join('&')
    puts "Fetching #{v.length} fields from ACS..."
    puts "URL: #{url}"
    resp = JSON.parse open(url).read
    colnames, *data = *resp

    data.each do |row|
      r = Hash[colnames.zip row]

      # convert all values to ints except the geo identifiers
      r.keys.each do |k|
        unless ['state', 'county', 'tract'].include? k
          r[k] = r[k].to_i
        end
      end

      # tract ids in the neighborhood file include the state and county number
      tract_id = '11001' + r['tract']
      if tracts.has_key? tract_id
        tracts[tract_id].merge! r
      else
        tracts[tract_id] = r
      end
    end
  end

  tracts
end

# download all ACS variables and all corresponding margin-of-error variables.
# margin-of-error variables are obtained by replace E by M in the ACS variable name 
all_acs_fields = (fields_rename.values + fields_sum.values + fields_sub.values + fields_prod.values).flatten.uniq
all_acs_fields += all_acs_fields.map {|name| name.sub('E', 'M')}
tracts = census_query all_acs_fields

# compute dcaction variables from census variables

tracts.each do |tract_id, tract|

  fields_rename.each do |outname, acsname|
    errname = acsname.sub('E', 'M')
    tract[outname] = tract[acsname]
    tract[outname + "_margin"] = tract[errname]
  end

  fields_sub.each do |outname, acsfields|
    first, *rest = *acsfields
    errname = first.sub('E', 'M')
    tract[outname] = tract[first]
    tract[outname + "_margin"] = (tract[errname] / 1.645) ** 2

    rest.each do |acsname|
      errname = first.sub('E', 'M')
      tract[outname] -= tract[acsname]

      #Yes, +=. Using other data elmts may give us a smaller MoE by the sum-of-squares methods.
      tract[outname + "_margin"] += (tract[errname] / 1.645) ** 2 
    end

    tract[outname + "_margin"] = Math.sqrt(tract[outname + "_margin"]) * 1.645
  end
  
  # We found some Census documentation suggesting that we use the sqrt(sum of squares) for
  # the margin of error for aggregate estimates.
  # https://www.census.gov/acs/www/Downloads/data_documentation/Statistical_Testing/ACS_2008_Statistical_Testing.pdf
  # So that's what I'm doing here.
  fields_sum.each do |outname, acsfields|
    tract[outname] = 0
    tract[outname + "_margin"] = 0

    acsfields.each do |acsname|
      errname = acsname.sub('E', 'M')
      tract[outname] += tract[acsname]
      tract[outname + "_margin"] += (tract[errname] / 1.645) ** 2
    end
    tract[outname+"_margin"] = Math.sqrt(tract[outname + "_margin"]) * 1.645
  end

  # TODO: compute margin of error for product field

  fields_prod.each do |outname, acsfields|
    tract[outname] = 1
    tract[outname + "_margin"] = 0

    acsfields.each do |acsname|
      tract[outname] *= tract[acsname]
    end
  end

end

# write the result to a json file

File.open(TRACT_FILE, 'w') do |f|
  f.puts JSON.pretty_generate(tracts)
end
