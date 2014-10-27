# This script requires the following ruby gems:
#   rubyXL, nokogiri
#

require 'csv'
require 'json'
require 'rubyXL'

CROSSWALK_FILE = 'Neighborhood Cluster - Census Tract 2010 Equivalency File - 7-11-2012.xlsx'
TRACT_FILE = 'acs_tract_data.json'
NBHD_FILE = 'acs_nbhd_data.csv'

book = RubyXL::Parser.parse CROSSWALK_FILE
tract_data = JSON.parse IO.read(TRACT_FILE)

# using the crosswalk file, we build a hash of the form: 
#   { nbhd_id => { tract_id => portion, tract_id => portion, ... }, ...} 
# where portion indicates the portion of the tract that should be assigned 
# to the given neighborhood.

crosswalk = {}

# get the nonsplit tracts from the first worksheet

sheet = book[0].extract_data
sheet.shift # remove first row

sheet.each do |row|
  tract_id, nbhd_id = row.map(&:to_s)

  if crosswalk.include? nbhd_id
    crosswalk[nbhd_id][tract_id] = 1
  else
    crosswalk[nbhd_id] = { tract_id => 1 }
  end
end

# get the split tracts from the second worksheet

sheet = book[1].extract_data
sheet.shift

sheet.each do |row|
  tract_id, nbhd_id, portion = row.map(&:to_s)

  if crosswalk.include? nbhd_id
    crosswalk[nbhd_id][tract_id] = portion
  else
    crosswalk[nbhd_id] = { tract_id => portion }
  end
end

# create a hash that aggregates variables to the neighborhood level using the
# above portions. By default, all variables are summed. For each field that ends
# in _numer, it will be divided by the corresponding variable ending in _denom
# to create a ratio. Field names in the list averaged_fields will be averaged.
#
# MARGIN OF ERROR SHOULD BE IGNORED FOR AVERAGES AND RATIOS

averaged_fields = []

nbhds = {}

crosswalk.each do |nbhd_id, tracts|
  nbhds[nbhd_id] = Hash.new {0}

  tracts.each do |tract_id, portion|
    if tract_data.include? tract_id
      tract_data[tract_id].each do |var, val|
        nbhds[nbhd_id][var] += val * portion.to_f if val.is_a? Numeric
      end
    else
      puts "No tract: '#{tract_id}'"
    end
  end

  # create gis_id Nbclus_123

  nbhds[nbhd_id]['gis_id'] = sprintf("Nbclus_%03d", nbhd_id)

  # compute averages

  tract_total_weight = tracts.values.map{|v| v.to_f}.inject(&:+)
  averaged_fields.each do |f|
    nbhds[nbhd_id][f] = nbhds[nbhd_id][f].to_f / tract_total_weight
  end

  # compute ratios
  nbhds[nbhd_id].keys.each do |f|
    if f =~ /_numer$/
      fbase = f[0...-6]

      if nbhds[nbhd_id][fbase+'_denom'] != 0
        nbhds[nbhd_id][fbase] = nbhds[nbhd_id][f].to_f / nbhds[nbhd_id][fbase+'_denom']
      else
        nbhds[nbhd_id][fbase] = -1
      end
    end
  end
end

# write result to a CSV file

colnames = nbhds.first[1].keys

CSV.open(NBHD_FILE, 'w') do |csv|
  csv << ["neighborhood_id"] + colnames

  nbhds.each do |nbhd_id, vars|
    csv << [nbhd_id] + colnames.map {|s| vars[s]}
  end
end
