# to-do
# make the gui less ugly/clean up that code

# add support for more input files other than json/csv -- this will make initial form more complicated, is it worth it?

# need to add option for how to parse json file -- right now tracts are put in index column, so a lot of adjustment specific to the acs tract to neighborhood conversion has to take place, not sure this will work for all json files

# also census tracts are by default parsed as dates in json file, need to make sure that's turned off

# check ruby code to make sure math is being done correctly -- initial sanity check shows population totals are the same in the file produced by this code and the file produced by the ruby code

# right now this only works for files in the same directory as the script and outputs the resulting csv to the same directory, so this needs to handle inputs/outputs to other places. cw_test currently holds all the test files used to make this work.

import pandas as pd
from Tkinter import *
from ttk import *

#input: csv/json/other delimited files / output: df
def importFile(fileName, geo_old):
    if 'json' in fileName:
        data = pd.read_json(fileName, orient='index', convert_axes=0) # make sure tracts remain tracts, not dates
        data[geo_old] = data.index
        data.reset_index(level=0, inplace=True)
        data[geo_old] = data[geo_old].convert_objects(convert_numeric = True)
        data.drop('index', axis=1, inplace=True)
        return data
    elif 'csv' in fileName:
        return pd.read_csv(fileName)

# input: df / output: df
# cross is the df containing the crosswalk
# data is the df containing the data to be converted
# geo_old is a string defining which column contains the common geography
# geo_new is a string defining which column contains the new geography
# weight is a string defining which column contains the weighting column
def processing(cross, data, geo_old, geo_new, weight):
	# merge two files into one file with data cols, geoid_original, geoid_new, weight
	merged = pd.merge(cross,data,on=geo_old)

	columns = list(merged) #get a list of columns

	# convert all columns we need to do math on to numeric
	# not sure this is necessary, but it was causing me problems with the zip code file
	toRemove = [geo_old, geo_new, weight]
	indices = [columns.index(y) for y in toRemove]
	toNumeric = [i for j, i in enumerate(columns) if j not in indices]

	for col in toNumeric:
		merged[col] = merged[col].convert_objects(convert_numeric = True) #convert to numeric
		merged[col] = merged[col].multiply(merged[weight]) #multiply data by weights column

	#aggregate based on geoid_new
	grouped = merged.groupby([geo_new]).sum()

	#keep only geo_new, weighted columns
	#toNumeric.append(geo_new)
	final = grouped.loc[:, toNumeric]

	return final

#input: csv/json via user form / output: csv
def main():
	#user inputs
	datafile=e1.get()
	crossfile=e2.get()
	geo_old=e3.get()
	geo_new=e4.get()
	weight=e5.get()
	outname=e6.get()

	#import crosswalk and data files
	data = importFile(datafile, geo_old)
	cross = importFile(crossfile, geo_old)

	#if there's no weight column defined for crosswalk
	#print warning and set equal to 1
	if len(weight) == 0:
		cross['weight'] = 1
		weight = 'weight'
		print 'No weight column specified, setting all weights equal to 1.'

	#merge, weight, and output new dataframe	
	final = processing(cross, data, geo_old, geo_new, weight)

	#output new file to csv
	final.to_csv(outname)

# make form for user inputs
# cannot press enter until all fields are filled
# figure out how to make the gray backgrounds go away
window = Tk()
window.title('data converter')

Button(window, text='Quit', command=window.quit).grid(row=6,column=1, pady=4)
enter = Button(window, text='Enter', command=main)
enter.grid(row=6,column=0, pady=4)
enter.config(state='disabled')

def disableButton(*args):
	data = stringvar1.get()
	cross = stringvar2.get()
	geo_old = stringvar3.get()
	geo_new = stringvar4.get()
	output = stringvar5.get()

	if data and cross and geo_old and geo_new and output:
		enter.config(state='normal')
	else:
		enter.config(state='disabled')

Label(window, text='Path to data file').grid(row=0, column=0, sticky='we')
Label(window, text='Path to crosswalk file').grid(row=1, column=0, sticky='we')
Label(window, text='Old geography\n(geography coverting from)').grid(row=2, column=0, sticky='we')
Label(window, text='New geography\n(geography coverting to)').grid(row=3, column=0, sticky='we')
Label(window, text='Weight column\n(in crosswalk file)').grid(row=4, column=0, sticky='we')
Label(window, text='Name of output file').grid(row=5, column=0, sticky='we')

stringvar1 = StringVar(window)
stringvar2 = StringVar(window)
stringvar3 = StringVar(window)
stringvar4 = StringVar(window)
stringvar5 = StringVar(window)

stringvar1.trace('w', disableButton)
stringvar2.trace('w', disableButton)
stringvar3.trace('w', disableButton)
stringvar4.trace('w', disableButton)
stringvar5.trace('w', disableButton)

e1 = Entry(window, textvariable=stringvar1)
e2 = Entry(window, textvariable=stringvar2)
e3 = Entry(window, textvariable=stringvar3)
e4 = Entry(window, textvariable=stringvar4)
e5 = Entry(window)
e6 = Entry(window, textvariable=stringvar5)

e1.grid(row=0, column=1, sticky='we')
e2.grid(row=1, column=1, sticky='we')
e3.grid(row=2, column=1, sticky='we')
e4.grid(row=3, column=1, sticky='we')
e5.grid(row=4, column=1, sticky='we')
e6.grid(row=5, column=1, sticky='we')

#insert default values into form
# #medicaid data
# e1.insert(10, 'cw_test/medicaid_data.csv')
# e2.insert(10, 'cw_test/zip_neighborhood.csv')
# e3.insert(10, 'zip')
# e4.insert(10, 'neighborhood')
# e5.insert(10, 'portion')
# e6.insert(10, 'cw_test/test3.csv')

#acs data
e1.insert(10, 'cw_test/acs_tract_data.json')
e2.insert(10, 'cw_test/tract_neighborhood.csv')
e3.insert(10, 'tract')
e4.insert(10, 'neighborhood')
e5.insert(10, 'portion')
e6.insert(10, 'cw_test/test4.csv')


window.columnconfigure(1, weight=1)

#style = Style()
#style.configure('.', font=('Helvetica', 12, 'bold'))

if __name__ == '__main__': 
	window.mainloop()