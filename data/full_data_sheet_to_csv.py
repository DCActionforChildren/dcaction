from settings import * # this is where the GOOGLE_SPREADSHEET_USER, etc would go
from google_spreadsheet.api import SpreadsheetAPI
import pandas as pd

GOOGLE_SPREADSHEET_USER = 'pete@datakind.org'
GOOGLE_SPREADSHEET_PASSWORD = 'J@k3_P0rw@y'
GOOGLE_SPREADSHEET_SOURCE = ''

# create spreasheets api object
api = SpreadsheetAPI(GOOGLE_SPREADSHEET_USER, 
        GOOGLE_SPREADSHEET_PASSWORD, GOOGLE_SPREADSHEET_SOURCE)


def get_sheet_from_name(sheet_name):
    spreadsheets = api.list_spreadsheets()
    target_sheet = None
    for i, sheet in enumerate(spreadsheets):
        if spreadsheets[i][0] == sheet_name:
            target_sheet = sheet
    return target_sheet

def get_rows_from_sheet(sheet, sheet_ix):
    if sheet_ix == None:
        print "whoops, no sheet"
    worksheet = api.list_worksheets(sheet[1])[sheet_ix]
    target_sheet = api.get_worksheet(sheet[1], worksheet[1])
    return target_sheet.get_rows()

def sheet_name_to_df(name, sheet_ix):
    sheet = get_sheet_from_name(name)
    sheet = get_rows_from_sheet(sheet, sheet_ix)
    return pd.DataFrame(sheet)


def create_full_data():
    # the Google Drive api strips spaces and underscores so we need to create
    # a list of the column names used in the visualization
    cols = [
        'Cluster_ID', 'Cluster', 'dental_visit',
        'er_ast_10', 'fs_client_2012', 'medicaid_enroll',
        'prev_med_visit', 'libraries', 'grocery',
        'bus_stops', 'metro', 'rec', 'violent_crimes',
        'cc_cap', 'cc_sub_13', 'vacants', 'grad', 'math',
        'reading', 'population_total', 'population_total_margin',
        'population_under_18', 'population_under_18_margin',
        'median_family_income_numer', 'median_family_income_numer_margin',
        'median_family_income_denom', 'median_family_income_denom_margin',
        'single_mother_families', 'single_mother_families_margin', 
        'population_white_total', 'population_white_total_margin',
        'population_black_total', 'population_black_total_margin',
        'population_hisp_total', 'population_hisp_total_margin',
        'total_neighborhood_poverty_numer', 'total_neighborhood_poverty_numer_margin',
        'total_neighborhood_poverty_denom', 'total_neighborhood_poverty_denom_margin',
        'homeownership_denom', 'homeownership_denom_margin', 'work_denom',
        'work_denom_margin', 'white_18', 'white_18_margin', 'black_18', 
        'black_18_margin', 'hispanic_18', 'hispanic_18_margin',
        'other_18', 'other_18_margin', 'other_under_18',
        'other_under_18_margin', 'no_hs_degree_18_24', 'no_hs_degree_18_24_margin',
        'population_under_5', 'population_under_5_margin',
        'children_in_poverty_numer','children_in_poverty_numer_margin',
        'children_in_poverty_denom', 'children_in_poverty_denom_margin',
        'population_other_total', 'population_other_total_margin',
        'white_under_18', 'white_under_18_margin',
        'black_under_18', 'black_under_18_margin', 'hispanic_under_18',
        'hispanic_under_18_margin', 'no_hs_degree_25_plus', 'no_hs_degree_25_plus_margin',
        'youth_ready_to_work_numer', 'youth_ready_to_work_numer_margin', 
        'youth_ready_to_work_denom', 'youth_ready_to_work_denom_margin',
        'homeownership_numer', 'homeownership_numer_margin',
        'work_numer', 'work_numer_margin', 'median_family_income',
        'total_neighborhood_poverty', 'children_in_poverty', 'youth_ready_to_work',
        'homeownership', 'work', 'pop_nothisp_white', 'pop_nothisp_black',
        'pop_nothisp_other', 'pop_hisp', 'pop_nothisp_white_under18', 
        'pop_nothisp_black_under18', 'pop_nothisp_other_under18', 'pop_hisp_under18'
    ]

    # fetch the full data from Google Drive
    dcac = sheet_name_to_df('DCAC DataBook v2 aggregation', 0).fillna(0)
    # sort the columns and prepend 'rowid'
    cols = sorted(cols, key=str.lower)
    cols = ['rowid'] + cols
    dcac.columns = cols
    # replace '#DIV/0!' from sheet with zeros
    dcac = dcac.replace(to_replace='#DIV/0!', value=0)
    # replace '#N/A' from sheet with zeros
    dcac.replace(to_replace='#N/A', value=0)
    # drop the google rowid column
    dcac = dcac.drop('rowid', 1)
    #write the csv
    dcac.to_csv('./full_data.csv', index=False)


def create_source_data():
    sources = sheet_name_to_df('DCAC DataBook v2 aggregation', 1)
    sources = sources.ix[:, ['layer', 'source', 'url']]
    sources.to_csv('./source_dummy.csv', index=False)


def main():
    print "Creating full data csv"
    create_full_data()
    print "Creating source data csv"
    create_source_data()
    print "Done"


if __name__ == '__main__':
    main()

    
