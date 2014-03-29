from settings import * # this is where the GOOGLE_SPREADSHEET_USER, etc goes
from google_spreadsheet.api import SpreadsheetAPI
import pandas as pd

# create spreasheets api object
api = SpreadsheetAPI(GOOGLE_SPREADSHEET_USER, 
        GOOGLE_SPREADSHEET_PASSWORD, GOOGLE_SPREADSHEET_SOURCE)


dcac = sheet_name_to_df('DCAC DataBook v2 aggregation', 0).fillna(0)
health44 = sheet_name_to_df('health_44cluster', 0).fillna(0)

cols = [
    'row_id', 'bus_stops', 'cc_sub12', 'cc_sub_13',
    'cc_cap', 'cluster', 'cluster_id', 'grocery',
    'libraries', 'metro', 'rec', 'recv1', 'vacants',
    'violent_crimes'
]

dcac.columns = cols
dcac = dcac.drop('recv1',1)
dcac = dcac.drop('cc_sub12',1)
dcac = dcac.drop('row_id',1)

# add columns: 'cc_ratio', 'cc_ratio_demand'
# cc_cap / children_under_5
# cc_cap / children_under_5_poverty

col_names = [
    'cluster_id', 'dental_visit', 'er_ast_10', 
    'prev_med_visit', 'fs_client_2012'
]
target_cols = [
    'clusterid', 'dentalvisit', 'erast10', 
    'prevmedvisit', 'fsclient2012'
]
health = health44.ix[1:, target_cols]
health.columns = col_names

health_agg = pd.merge(dcac, health, on='cluster_id')

# TODO: 
# pull in acs nbhd data
# add cluster_id column to acs data
# merge health_agg with acs_nbhd
# write csv


def get_sheet_from_name(sheet_name):
    spreadsheets = api.list_spreadsheets()
    target_sheet = None
    for i, sheet in enumerate(spreadsheets):
        if spreadsheets[i][0] == sheet_name:
            target_sheet = sheet
    return target_sheet

def get_rows_from_sheet(sheet, sheet_ix):
    # fetch the sheet with volunteer info
    if sheet_ix == None:
        print "whoops, no sheet"
    worksheet = api.list_worksheets(sheet[1])[sheet_ix]
    target_sheet = api.get_worksheet(sheet[1], worksheet[1])
    return target_sheet.get_rows()

def sheet_name_to_df(name, sheet_ix):
    sheet = get_sheet_from_name(name)
    sheet = get_rows_from_sheet(sheet, sheet_ix)
    return pd.DataFrame(sheet)