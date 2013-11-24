# This script requires the following ruby gems:
#   rubyXL, nokogiri
#

# TODO: currently this script performs weighted sums of tract-level variables.
# It doesn't do any other kind of aggregateion (e.g., weighted average)

require 'json'
require 'rubyXL'

CROSSWALK_FILE = 'Neighborhood Cluster - Census Tract 2010 Equivalency File - 7-11-2012.xlsx'
TRACT_FILE = 'tracts.json'
NBHD_FILE = 'nbhds.json'

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
# above portions

nbhds = {}

crosswalk.each do |nbhd_id, tracts|
  nbhds[nbhd_id] = Hash.new {0}

  tracts.each do |tract_id, portion|
    if tract_data.include? tract_id
      tract_data[tract_id].each do |var, val|
        nbhds[nbhd_id][var] += val * portion.to_f
      end
    else
      puts "No tract: '#{tract_id}'"
    end
  end
end

File.open(NBHD_FILE, 'w') do |f|
  f.puts JSON.pretty_generate(nbhds)
end
