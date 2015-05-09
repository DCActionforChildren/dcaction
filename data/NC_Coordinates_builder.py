# Written by Krishna Chakka (krishna.chakka@gmail.com)
# and Abhishek Sharma (absharma@gmail.com) during DataKind DC 2015
# Purpose:
# 	Adds neighborhood id and gis_id to a points json file
# To execute:
#	python NC_Coordinates_builder.py <jsonLocationsFile> ...
# Output:
# <jsonLocationFile>_transformed.json

import getCoordinates
import os
import pprint,argparse

def addGisCoordinates(file):
	
	print "Now Processing...", file
	
	outfile = os.path.splitext(file)[0]+"_transformed"+os.path.splitext(file)[1]
	print outfile
	
	with open(file) as data_file:
		data=json.load(data_file)

	category=data.keys()[0]

	print "Processing...",category
	
	items=data[category]
	
	outputData = []
	
	for item in items:
		lat = item["lat"]
		long = item["long"]
		(neighborHood_id,gis_id) = getCoordinates.getNCCoordinates(long,lat)
		item["nc_id"]=neighborHood_id
		item["nc_gis_id"]=gis_id
		outputData.append(item)
	
	fileContent={}
	
	fileContent[category]=outputData
	
	#fileContent_pretty = pprint.pformat(fileContent,indent=4)
	
	
	
	with open(outfile,'w') as outfile:
		json.dump(fileContent,outfile,indent=4)
		#print >> outfile, j
	
    
def main():
	parser = argparse.ArgumentParser()
	
	parser.add_argument('inputFile', help='json file with neighborhood coordinates',nargs='+')
	args = parser.parse_args()
	for arg in args.inputFile:
		addGisCoordinates(arg)	
	
	
	#addGisCoordinates("dcps.json")
	#addGisCoordinates("charters.json")
	
if __name__=="__main__":
	main()
