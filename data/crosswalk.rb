require 'json'
require 'rubyXL'
require 'pp'

CROSSWALK_FILE = 'Neighborhood Cluster - Census Tract 2010 Equivalency File - 7-11-2012.xlsx'
TRACT_FILE = 'tracts.json'
NBHD_FILE = 'nbhds.json'

book = RubyXL::Parser.parse CROSSWALK_FILE
tract_data = JSON.parse IO.read(TRACT_FILE)

crosswalk = {}

# get the nonsplit tracts
sheet = book[0].extract_data
sheet.shift # remove first row

sheet.each do |row|
  tract_id, nbhd_id = row

  if crosswalk.include? nbhd_id
    crosswalk[nbhd_id][tract_id] = 1
  else
    crosswalk[nbhd_id] = { tract_id => 1 }
  end
end

# get the split tracts
sheet = book[1].extract_data
sheet.shift

sheet.each do |row|
  tract_id, nbhd_id, portion = row

  if crosswalk.include? nbhd_id
    crosswalk[nbhd_id][tract_id] = portion
  else
    crosswalk[nbhd_id] = { tract_id => portion }
  end
end

# crosswalk: 
#
# { nbhd_id => { tract_id => portion, ...}

nbhds = {}

crosswalk.each do |nbhd_id, tracts|
  nbhds[nbhd_id] = Hash.new {0}

  tracts.each do |tract_id, portion|
    unless tract_data.include? tract_id
      puts "No tract: #{tract_id}"
      next
    end

    tract_data[tract_id].each do |var, val|
      nbhds[nbhd_id][var] += val * portion
    end
  end
end

File.open(NBHD_FILE, 'w') do |f|
  f.puts JSON.pretty_generate(nbhds)
end
