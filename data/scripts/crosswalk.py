import pandas as pd
import numpy as np
from Tkinter import *
from ttk import *
import os, sys

# Function to import file whether json or csv. Input: csv/json / output: df.
def import_file(file_name, geo_old):
    if "json" in file_name:
        data = pd.read_json(file_name, orient="index", convert_axes=0) # make sure tracts remain tracts, not dates
        data[geo_old] = data.index
        data.reset_index(level=0, inplace=True)
        data[geo_old] = data[geo_old].convert_objects(convert_numeric = True)
        data.drop("index", axis=1, inplace=True)
        data.columns = map(lambda x: x.lower(), data.columns)
    elif "csv" in file_name:
        data = pd.read_csv(file_name)
        data.columns = map(lambda x: x.lower(), data.columns)
    return data

# Function to merge crosswalk and data file and multiple data by weights. Input: df / output: df.
def merge_and_weight(cross, data, geo_old, geo_new, weight, weight2):
	merged = pd.merge(cross,data,on=geo_old)

	columns = list(merged)

	# Get single weight column, then multiply all data columns by weight
	indices = [columns.index(y) for y in [geo_old, geo_new, weight, weight2]]
	data_cols = [i for j, i in enumerate(columns) if j not in indices]
	
	merged['weight_tot'] = merged[weight].multiply(merged[weight2])
		
	for col in data_cols:
		merged[col] = merged[col].convert_objects(convert_numeric = True)
		merged[col] = merged[col].multiply(merged['weight_tot'])

	data_cols.append(geo_new)
	return merged.loc[:, data_cols]

# Function to calculate square root of sum of squares
def sqrt_sos(data, columns, geo_new):
	for col in columns:
		if col != geo_new:
			data[col] = data[col]**2

	data_agg = data.groupby([geo_new]).sum()

	for col in columns:
		if col != geo_new:
			data_agg[col] = data_agg[col]**.5
	return data_agg

# Main function launched with GUI form. Input: csv/json via user form / output: csv.
def main():
	# User inputs/get data from files
	data_file = os.path.join("inputs", e1.get()) 
	cross_file = os.path.join("inputs", e2.get())
	geo_old = e3.get()
	geo_new = e4.get()

	data = import_file(data_file, geo_old)
	cross = import_file(cross_file, geo_old)

	# If there's no weight column or secondary weight column defined for crosswalk, print warning and set equal to 1
	if len(e5.get()) > 0:
		weight = e5.get()
	else:
		weight = "weight"
		cross[weight] = 1
		print "No weight column specified, setting all weights equal to 1."

	if len(e6.get()) > 0:	
		weight2 = e6.get()
	else:
		weight2 = "weight2"
		cross[weight2]= 1
		print "No second weight column specified, setting all secondary weights to 1."

	# Merge crosswalk and data, weight data for new geography
	merged = merge_and_weight(cross, data, geo_old, geo_new, weight, weight2)

	# Merge data and calculate ratios for counts and MOEs
	# Split data into count and margin columns, to simplify code for aggregation/calculations
	columns = list(merged)
	counts = [x for x in columns if "_margin" not in x]
	margins = [x for x in columns if "_margin" in x]
	margins.append(geo_new)

	count_data = merged.loc[:, counts]
	margin_data = merged.loc[:, margins] 

	# Sum counts by new geography, aggregate MOEs using sum of squares
	count_agg = count_data.groupby([geo_new]).sum()
	margin_agg = sqrt_sos(margin_data, margins, geo_new)

	# Calculate ratios
	bases = [r.replace("_numer","") for r in counts if "_numer" in r]

	for base in bases:
		numer = "{}_numer".format(base)
		denom = "{}_denom".format(base)
		ratio = "{}_ratio".format(base)
		numer_margin = "{}_numer_margin".format(base)
		denom_margin = "{}_denom_margin".format(base)
		ratio_margin = "{}_ratio_margin".format(base)

		try:
			count_agg[ratio] = count_agg[numer] / count_agg[denom]
			count_agg[np.isinf(count_agg)] = 1 # Inf set equal to 1
		except:
			print "{0} or {1} missing for variable {2}.".format(numer, denom, ratio)

		if base in margins:
			try:
				# Margin for ratios uses formula from appendix for derived ratios because it is more conservative (eg yields wider margins) and doesn't yield negatives under root
				# Source: https://www.census.gov/content/dam/Census/library/publications/2009/acs/ACSResearch.pdf
				margin_agg[ratio_margin] = ((margin_agg[numer_margin]**2 + ((count_agg[ratio]**2)*margin_agg[denom_margin]**2))**.5)/count_agg[denom]
			except:
				print "{0}, {1}, {2}, {3} for variable {4}.".format(numer_margin, denom_margin, ratio, denom, ratio_margin)

		count_agg.drop([numer, denom], axis=1, inplace=True) #these need to go at the end because margin calculation needs denom var
		margin_agg.drop([numer_margin, denom_margin], axis=1, inplace=True)

	final = pd.concat([count_agg, margin_agg], axis=1)

	# Output new file to csv
	name = e1.get().split(".")[0]
	finalfile = "{0}_{1}.csv".format(name, geo_new)
	output_file = os.path.join("outputs", finalfile)
	final.to_csv(output_file)
	print "Completed. Converted final data set named {}.".format(finalfile)

# Make form for user inputs
# Cannot press enter until all fields are filled
window = Tk()
window.title("Crosswalk Script")

Button(window, text="Quit", command=window.quit).grid(row=7,column=1, pady=4)
enter = Button(window, text="Enter", command=main)
enter.grid(row=7,column=0, pady=4)
enter.config(state="disabled")

def disable_button(*args):
	data = stringvar1.get()
	cross = stringvar2.get()
	geo_old = stringvar3.get()
	geo_new = stringvar4.get()

	if data and cross and geo_old and geo_new:
		enter.config(state="normal")
	else:
		enter.config(state="disabled")

Label(window, text="Path to data file").grid(row=0, column=0, sticky="we")
Label(window, text="Path to crosswalk file").grid(row=1, column=0, sticky="we")
Label(window, text="Old geography\n(geography coverting from)").grid(row=2, column=0, sticky="we")
Label(window, text="New geography\n(geography coverting to)").grid(row=3, column=0, sticky="we")
Label(window, text="Weight column\n(in crosswalk file)").grid(row=4, column=0, sticky="we")
Label(window, text="Optional second weight column\n(in crosswalk file)").grid(row=5, column=0, sticky="we")

stringvar1 = StringVar(window)
stringvar2 = StringVar(window)
stringvar3 = StringVar(window)
stringvar4 = StringVar(window)
stringvar5 = StringVar(window)
stringvar6 = StringVar(window)

stringvar1.trace("w", disable_button)
stringvar2.trace("w", disable_button)
stringvar3.trace("w", disable_button)
stringvar4.trace("w", disable_button)

e1 = Entry(window, textvariable=stringvar1)
e2 = Entry(window, textvariable=stringvar2)
e3 = Entry(window, textvariable=stringvar3)
e4 = Entry(window, textvariable=stringvar4)
e5 = Entry(window)
e6 = Entry(window)

e1.grid(row=0, column=1, sticky="we")
e2.grid(row=1, column=1, sticky="we")
e3.grid(row=2, column=1, sticky="we")
e4.grid(row=3, column=1, sticky="we")
e5.grid(row=4, column=1, sticky="we")
e6.grid(row=5, column=1, sticky="we")

window.columnconfigure(1, weight=1)

if __name__ == "__main__": 
	window.mainloop()