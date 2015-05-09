# encoding: UTF-8

require 'json'
require 'open-uri'
require 'yaml'

DEFAULT_OUTPUT_DIRECTORY = 'outputs'
DEFAULT_OUTPUT_FILE = 'acs_tract_data.json'
DEFAULT_OUTPUT_ACS_VARIABLES = false

config_file = ARGV.shift || 'config.yaml'
config = YAML::load open(config_file).read

acs_year = config['api']['acs_year'] or raise ArgumentError, 'No ACS year specified'
acs_period = config['api']['acs_period'] or raise ArgumentError, 'No ACS period specified'

raise ArgumentError, 'No ACS geography specified' unless config['api']['acs_geography']

# construct the base URL

base_url = "http://api.census.gov/data/#{acs_year}/acs#{acs_period}?"
puts "Using base URL: #{base_url}"

# construct the geo parameter

geo_for_key, geo_for_value = config['api']['acs_geography']['for'].first
geo_for_value = "*" if geo_for_value =~ /all/i
geo_for = "#{geo_for_key}:#{geo_for_value}"

geo_in = config['api']['acs_geography']['in'].first.join(':')

geo = "for=#{geo_for}&in=#{geo_in}"
puts "Using Census geography: #{geo}"

# get the remaining configuration variables

if config.include? 'output'
  output_directory = config['output']['directory'] || DEFAULT_OUTPUT_DIRECTORY
  output_file = config['output']['file'] || DEFAULT_OUTPUT_FILE
  output_acs_variables = config['output']['acs_variables'] || DEFAULT_OUTPUT_ACS_VARIABLES
else
  output_directory = DEFAULT_OUTPUT_DIRECTORY
  output_file = DEFAULT_OUTPUT_FILE
  output_acs_variables = DEFAULT_OUTPUT_ACS_VARIABLES
end

output_file = File.join output_directory, output_file

puts "Using output file: #{output_file}"

['fields_rename', 'fields_sum', 'fields_sub', 'fields_prod'].each do |name|
  unless config.include? name
    puts "WARNING: #{name} does not appear in configuration"
  end
end

fields_rename = config['fields_rename'] || []
fields_sum = config['fields_sum'] || []
fields_sub = config['fields_sub'] || []
fields_prod = config['fields_prod'] || []

# This function performs the Census API query. It returns a hash of hashes of the form
#     { tract1 => {var1 => val11, var2 => val12, ... },
#       tract2 => {var1 => val12, var2 => val22, ... }, ... }
#
def census_query(vars, base_url, geo)
  tracts = {}
  vars.each_slice(50) do |v|
    url = [base_url, 'get=' + v.join(','), geo].join('&')
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
tracts = census_query all_acs_fields, base_url, geo

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

# remove ACS variables from output

unless output_acs_variables
  tracts.each_value do |tract|
    all_acs_fields.each {|f| tract.delete f}
  end
end

# write the result to a json file

File.open(output_file, 'w') do |f|
  f.puts JSON.pretty_generate(tracts)
end
