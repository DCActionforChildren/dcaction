# DC Action for Children Data Tools 2.0

DC Action for Children, the Kids Count grantee for the District of Columbia, in partnership with DataKind and dozens of volunteers, created this map of measures of child well-being. This tool allows residents, program providers, and others to easily access and view this data. Users select from a list of available data layers to display the data for a given "neighborhood cluster," a geographic type used in DC, as well as the neighborhood's demographic composition.

The tool currently uses DC's geographies and data which can be repurposed for other Kids Count grantees, or other projects and purposes. The code that powers the tool is free and open source, meaning others can copy, make changes, and redeploy it. DC Action for Children worked with DataKind DC to develop the map. Across the US and around the world, there are communities of volunteers who can support efforts to create a "[fork](https://help.github.com/articles/fork-a-repo/)" of this tool specific to your city, state, or region. [Read about examples from around the globe.](http://www.datakind.org/blog/mapping-youth-well-being-worldwide-with-open-data/)

## Contents

* [How it works](#how-it-works)
* [Setting up your own version](#setting-up-your-own-version)
  * [What does it take to set up my own version of something similar?](#what-does-it-take-to-set-up-my-own-version-of-something-similar)
  * [What features can I reuse for my version?](#what-features-can-i-reuse-for-my-version)
* [Pulling together the data](#pulling-together-the-data)
  * [Data sources and methodology](#data-sources-and-methodology)
  * [Retrieving census data](#retrieving-census-data)
  * [Updating layer data](#updating-layer-data)
  * [Updating point data](#updating-points-data)
  * [Crosswalking geographies](#crosswalking-geographies)
  * [Using the crosswalk script](#using-the-crosswalk-script)

## How it works

The Data Tools are an online map of neighborhood data that is powered by two easy-to-edit documents:

1. **A map file** that describes the shape of the neighborhoods called a GeoJSON
2. **A spreadsheet** file with one row for each neighborhood unit in the GeoJSON file and one column for each neighborhood dataset measure you want to display as an area Layer in the map. There are also spreadsheet files for points (like schools).

For the DC Action Data Tools deployment, the [map file](https://github.com/DCActionforChildren/dcaction/blob/gh-pages/data/neighborhood_boundaries.json) has the 39 DC neighborhood clusters and the [spreadsheet file](https://github.com/DCActionforChildren/dcaction/blob/gh-pages/data/neighborhoods.csv) has 65 columns with half of them from the US Census Bureau and half of them from other local sources. The data from these primary sources is "crosswalked", or recalculated, from original geographic areas (some are zipcodes, some are census tracts, some are points) to match the neighborhood cluster areas chosen for map layers in this deployment. There are also a few points files for [schools](https://github.com/DCActionforChildren/dcaction/blob/gh-pages/data/dcps.csv), [hospitals](https://github.com/DCActionforChildren/dcaction/blob/gh-pages/data/hospitals.csv), and [libraries](https://github.com/DCActionforChildren/dcaction/blob/gh-pages/data/libraries.csv) that display as individual points on the map, instead of as shaded geographic areas. There are also two configuration files called fields and sources that can be updated as described in the Data section below.

## Setting up your own version

This section talks about how to set up your own version.

The [first part](#what-does-it-take-to-set-up-my-own-version-of-something-similar) steps you through that process of deploying your own. The [second part](#what-features-can-i-reuse-for-my-version) talks about the key features that may be useful to you depending on where you are in the world.

### What does it take to set up my own version of something similar?

*What category best describes you?*

* A. I am web wizard. HTML, Javascript, and CSS crumble before me.
* B. I am a neighborhood data champion! I know how to work with Excel.
* C. I am a community mover and shaker! I spend most of my time connecting with people in the community and finding ways to help.

*If you chose A or B, here's how you get started:*

* Sign-up for [GitHub](https://github.com)
* Run the application on your local machine
  * Get access to the [dcaction repo](https://github.com/DCActionforChildren/dcaction) (consider forking, to make it your own).
  * Clone the repository to your local machine (e.g., git clone git@github.com:DCActionforChildren/dcaction.git).
  * Start a local server so that you can view the site in a web browser.
    * On Mac or Linux, you can open a terminal and run a Python simple server by entering python -m SimpleHTTPServer.
    * On Windows, you'll need an additional tool. One possibility is to install Cygwin and then run the above command.
  * Open a browser. If you use the options suggested above, the site will appear at [http://localhost:8000](http://localhost:8000)
* Update the GeoJSON file with the neighborhood geography you want to use
* Update the data you want to use (see: "Updating Layer Data" in the next section on "Data")
* You can edit index.html to customize the title, description, and more.
* Reposition the map to your area of interest
* Review the new application on your local machine once again
* If you like what you see, push to the web!

*If you choose C, here's how you get started:*

* Get in contact with your local civic hacking community ([Code for America Brigades](https://www.codeforamerica.org/brigade/) are great).
* If no one is local, reach out to the wider online community. Ask around until you find some folks who can help you through the steps above.
* You can do this!

### What features can I reuse for my version?

*Where are you in the world?*

*If you are anywhere in the world, you can:*

* Deploy the core D3 map and visualization engine powered by GeoJSON and CSV files
* Link directly to a layer
  * DC Action tweets a "Monday Map" every week. In order to enable them to create a link directly to a data layer, we check the URL for a hash containing a layer ID on page load. As a * result, you can link directly to a layer by using a URL in the format: [http://datatools.dcactionforchildren.org/#population_under_18_val](http://datatools.dcactionforchildren.org/#population_under_18_val)

*If you are in the US, you can also use:*

* The code that extracts and transforms key census data indicators

*If you are also in DC, you can also use:*

* Any of the existing data from the current tool.


## Pulling together the data

This section talks about the data that powers the visualization.

In the below, you can learn more about:
* [The current DC Data Tool data sources and methodology](#data-sources-and-methodology)
* [The process for retrieving the census data](#retrieving-census-data)
* [The process for updating layer data](#updating-layer-data)
* [The process for updating point data](#updating-points-data)
* [How crosswalking from one geography to another works](#crosswalking-geographies)
* [How to use the crosswalking scripts](#using-the-crosswalk-script)

### Data sources and methodology

The DC Action Data Tool has posted the data sources on its website: [https://www.dcactionforchildren.org/dc-kids-count-data-tools-methodology](https://www.dcactionforchildren.org/dc-kids-count-data-tools-methodology)

The status of each of these sources is tracked in this Google Spreadsheet:
[https://docs.google.com/spreadsheets/d/1uF2nm5CS4tgrx9owv59VBaLnPGYVfXBkRhxT5auQ-3k](https://docs.google.com/spreadsheets/d/1uF2nm5CS4tgrx9owv59VBaLnPGYVfXBkRhxT5auQ-3k)

### Retrieving Census data

There are two functionally identical scripts to retrieve Census data, one written in Ruby and the other in Python. Check out the [documentation for the Ruby script](https://github.com/DCActionforChildren/dcaction/blob/gh-pages/data/README.md).

### Updating layer data

In order to make the tool easier to maintain, all data is stored and updated in spreadsheets. The below instructions pertain to the DC Action data, which can be found in a Google Spreadsheet, but could also be powered by an Excel spreadsheet, or any other tool that can output CSVs in the existing format.

1. We're going to be updating the sheets in this Google spreadsheet. Each of the sheets corresponds to a CSV that is stored in the data/ directory. The neighborhoods sheet contains all of the layer data. This is where we'll be making changes. The fields sheet lists all of the available layers; this populates the navigation. The sources sheet shows the source of each layer; this appears in the bottom left of the map when a layer is selected.
2. We will add our new data into a scratch sheet. We're expecting that it will have one row per neighborhood cluster, and that it'll have a label that matches the format of columns A, B, or D in the neighborhoods sheet.
3. If we need to calculate a per capita rate, we can use a VLOOKUP to grab the population from the neighborhoods sheet and calculate a new per capita row.
4. Finally, we will merge this back into the neighborhoods sheet by means of a VLOOKUP, overwriting the existing columns (if there are any). Before we're done, we'll want to ensure that we have copied and pasted values, so that there are no longer formulas connected to our scratch sheet.
5. Ensure that fields and source sheets include the same column name and have up-to-date information (i.e. the source contains the correct date).
6. Download the three sheets as CSVs, and replace the ones in the data folder of the GitHub repository.

### Updating points data

In addition to the data described in the Updating Layer Data section above, which colors neighborhoods according to their value, we also have the ability to add "points" to the map. These are points of interest like schools, libraries, and hospitals.

1. Each points layer is stored in a separate CSV file, named with the ID of the layer. 'dcps.csv' in the 'data/' folder is a great example.
2. All layers must have the columns 'name,' 'lat,' and 'long.' Schools also need the additional fields shown in 'dcps.csv.'
3. The CSVs should be saved in the data directory, and we need to make sure any changes are reflected in the fields and source sheets (see above).

### Crosswalking geographies

A crosswalk is a means of translating data that is aggregated at one geographic level, such as census tract, to another, such as a neighborhood cluster. We do this by using a crosswalk table, which shows the relationships (overlap) between the two. In the case of the above example, this table would contain columns with 1) the census tract ID, 2) the neighborhood cluster ID, and 3) the proportion of the census tract that is contained in the neighborhood.

Crosswalks are commonly used to express relationships between different levels of geography. We can simply and reliably crosswalk county level data to the state level, for example, because counties cluster within states and we know the population characteristics at each level. We have to make more assumptions when cross-walking data from tract to neighborhood because neighborhood boundaries do not follow census boundary lines and we do not have benchmark estimates of population characteristics at the neighborhood level.

The first assumption we make is that the population is uniformly distributed across the tract. For most tracts, this assumption is not relevant because the entire tract is contained within one neighborhood cluster. It is only important for tracts that cross neighborhood boundaries. In order to allocate the population across those boundaries, we use the proportion of the tract's land area that overlaps each neighborhood as the apportioning factor. The tract level population is apportioned into the two neighborhoods according to the proportion of its land area that is covered by each neighborhood.

The next assumption we make is that tracts are socioeconomically integrated. When we apportion tract level data on characteristics such as poverty, we apply the same land area apportion factor used for the total population. This implies that tracts will not contain concentrated areas of poverty, for example.

The wiki contains [more information on the crosswalking DC Action applied to the data](https://github.com/DCActionforChildren/dcaction/wiki/Crosswalking).

### Using the crosswalk script
1. We need Python and pandas and numpy.
  * Mac: Install Homebrew, then from the terminal, run `brew install python` and then `pip install pandas` and `pip install numpy`
  * Windows: Install Cygwin, then run `pip install pandas` and `pip install numpy`from the terminal.
  * Linux: You know what to do.
2. In the terminal, change to the data/scripts/ directory, and run `python crosswalk.py`.
3. An app will open with options for the data file that needs to be crosswalked, the crosswalk file, the geographies to convert to and from, the column(s) that contain the weighted overlap, and the name of the file to which to output the result.
