"""Synthetic catalog persistence/privacy regressions, no live database."""
import json
import os
import sys
import unittest
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from nutriclinic_vault import clean_data, scrub, SiteError

class CatalogTests(unittest.TestCase):
    def test_numeric_recipe_survives_validation_and_startup_scrub(self):
        data={'values':{'feedingDays':3,'otherFluidsMlDay':0},'product':{'catalog':{'firstId':1001,'secondId':1005,'firstMl':500,'secondMl':1000,'mode':2,'market':0}},'engine':'1.11.0'}
        self.assertEqual(json.loads(clean_data(scrub(data))),data)

    def test_arbitrary_catalog_text_is_not_a_route_for_patient_identifiers(self):
        data={'product':{'catalog':{'firstId':1001,'name':'PRIVATE-IDENTIFIER'}}}
        with self.assertRaises(SiteError):
            clean_data(data)
        self.assertEqual(scrub(data)['product']['catalog'],{'firstId':1001})

    def test_negative_and_nonfinite_catalog_values_are_rejected(self):
        for v in [-1,float('inf'),True,'PRIVATE']:
            with self.assertRaises(SiteError):
                clean_data({'product':{'catalog':{'firstMl':v}}})
