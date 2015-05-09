import json
import argparse

def readNeighborhoodJsonFile(filename):
	dataFile = open(filename)
	data = json.load(dataFile)

	listDictNeighborhoods = data['features']
	
	coordinateDict = {}
	gisDict = {}
	for lDN  in listDictNeighborhoods:
		nID = lDN['id']
		#print 'neighborHood ID', nID
		
		NC_coordinates = lDN['geometry']['coordinates'][0]
		NC_gis_id = lDN['properties']['gis_id']

		coordinateDict[nID] = NC_coordinates
		gisDict[nID] = NC_gis_id

	return (coordinateDict, gisDict)

def getNCCoordinates(lat, long):
	(coordinateDict,gisDict)=readNeighborhoodJsonFile("neighborhoods44.json")
	result=[]
	for key in coordinateDict.keys():
		if point_inside_polygon(lat, long, coordinateDict.get(key)):
				return (key,gisDict[key])
	return (0,0)

def point_inside_polygon(x,y,poly):
    n = len(poly) 	
	
    inside =False

    p1x,p1y = poly[0]
    for i in range(n+1):
        p2x,p2y = poly[i % n]
        if y > min(p1y,p2y):
            if y <= max(p1y,p2y):
                if x <= max(p1x,p2x):
                    if p1y != p2y:
                        xinters = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x,p1y = p2x,p2y

    return inside
	
	

def printCoordinateInfo(coordinateDict, gisDict):
	for key in coordinateDict.keys():
		print 'Neighborhood:', key, type(coordinateDict[key]), len(coordinateDict[key]), gisDict[key]

def main():
	(neighborHood_id,gis_id)=getNCCoordinates(0,0)
	 
	print neighborHood_id
	
	
if __name__=="__main__":
	main()
