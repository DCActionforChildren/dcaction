# DC Action for Children Data Tools 2.0


A data processing pipeline and interactive web visualization:

 * [Data Tools 2.0 visualization](http://datatools.dcactionforchildren.org/)
 * [Methodology documentation](https://www.dcactionforchildren.org/dc-kids-count-data-tools-methodology)


Previous version:

 * [Data Tools 1.0 visualization](http://www.dcactionforchildren.org/dc-kids-count-data-tools)


Connected project:

* [Kids Count data center](http://datacenter.kidscount.org/data#DC)


US Census Bureau American Community Survey Annual DCAC DataTool Update Steps


1. Make sure you have Github account and can work with git locally on your computer.
2. Get access to the Repo on Github (https://github.com/DCActionforChildren/dcaction)
3. Clone the repository to your local machine (e.g. git clone git@github.com:DCActionforChildren/dcaction.git)
4. Run a simple server to test local instance (e.g. go to directory in terminal and run simple Python server by entering “python -m SimpleHTTPServer”)
5. Load the web address in your browser to view data tool
6. Go to Data folder and change date in fetch_acs.rb and run in Ruby (may need to install gem/library dependencies) to create 'acs_tract_data.json'.
7. Then run crosswalk.rb to which uses the cross-walk Excel in that folder transform 'acs_tract_data.json' into acs_nbhd_data.csv
8. Open up Google Spreadsheet for DataBook updating: https://docs.google.com/spreadsheet/ccc?key=0AliQRBwTvad9dHpVQkltc05MS2FzdGpCRFZSb0djdFE#gid=35
9. Check that all indicators are accounted for and up-to-date in the “Comparison” tab, and that the variable names correspond to the descriptions and explanations in the methodology website: http://www.dcactionforchildren.org/dc-kids-count-data-tools-methodology
10. If ACS updates are needed, copy and paste the named variable columns (you can ignore the Census numerically named ones in acs_nbhd_data.csv unless you need to debug) from acs_nbhd_data.csv file into an ACS tab and add NBHD cluster column for VLOOKUP.
11. Make sure “neighborhoods CSV” spreadsheet tab is calculating from the appropriate ACS tab via a VLOOKUP.  The VLOOKUP looks like this “=VALUE(VLOOKUP(A2,ACS2013!$A$1:$CA$45, 3, 0))” and looks at the clusterID in “A2” then matches it to the first column in “ACS2013!$A$1:$CA$45” then takes the value in the cell in column “3.”
12. Once the “neighborhoods CSV” spreadsheet tab is updated accordingly, it can be exported to CSV and saved in the Data folder to power the visualization.  It is recommended to do this locally and test thoroughly before pushing live to web server.
13. The visualization will then be powered by the new data file.
14. If additional data updates are needed (e.g. crime, health, child care), suggest adding them as separate tabs like ACS in the “DCAC DataBook v2 Updating” Google Spreadsheet and having the values auto-calculate in the “neighborhoods CSV” tab via VLOOKUP so that it can be easily updated in the future.  Alternatively, the data processing can be done via one script but this may be tricker for DCAC to debug and maintain.


Offshoot documentation that needs to be rolled in:

 * [updating census data steps](https://docs.google.com/document/d/1u9yJ1yJt6T4jOb_EUN6aXn-ugzuRCiNVmvRz19_k9cs/edit) (refs issue #124)
 * [data provenance and processing](http://bit.ly/DCA4C2VizData) (refs issue #129)
