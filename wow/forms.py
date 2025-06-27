import re
from django import forms
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError


class CommaSeparatedField(forms.CharField):
    def to_python(self, value):
        if value in self.empty_values:
            return self.empty_value
        value = str(value).split(",")
        if self.strip:
            value = [s.strip() for s in value]
        return value

    def prepare_value(self, value):
        if value is None:
            return None
        return ", ".join([str(s) for s in value])


class PaddedBBLForm(forms.Form):
    bbl = forms.CharField(
        validators=[
            RegexValidator(
                r"^[1-5]\d\d\d\d\d\d\d\d\d$",
                message="This should be a 10-digit padded BBL.",
            )
        ]
    )


class SeparatedBBLForm(forms.Form):
    borough = forms.CharField(
        validators=[
            RegexValidator(r"^[1-5]$", message="This should be 1, 2, 3, 4, or 5.")
        ]
    )

    block = forms.CharField(
        validators=[
            RegexValidator(
                r"^\d\d\d\d\d$", message="This should be a 5-digit zero-padded value."
            )
        ]
    )

    lot = forms.CharField(
        validators=[
            RegexValidator(
                r"^\d\d\d\d$", message="This should be a 4-digit zero-padded value."
            )
        ]
    )


class PaddedBBLListForm(forms.Form):
    bbls = CommaSeparatedField(
        label="10-digit padded BBL (comma-separated list)", required=True
    )

    def clean(self):
        data = self.cleaned_data
        if "bbls" not in data:
            return data
        for bbl in data["bbls"]:
            if not re.match(r"^[1-5]\d\d\d\d\d\d\d\d\d$", bbl):
                raise ValidationError(
                    f"Invalid BBL: '{bbl}'. All BBLs but be in 10-digit zer-padded format."
                )
        return data


class SignatureCollectionForm(forms.Form):
    collection = forms.CharField()


class DatasetLastUpdatedForm(forms.Form):
    dataset = forms.CharField(required=False)


def validate_district_types(value):
    VALID_DISTRICTS = [
        "coun_dist",
        "nta",
        "community_dist",
        "assem_dist",
        "stsen_dist",
        "zipcode",
        "census_tract",
    ]
    if value not in VALID_DISTRICTS:
        raise ValidationError(
            f"{value} is not a valid district type. Must be on of {', '.join(VALID_DISTRICTS)}",
        )


class DistrictTypeForm(forms.Form):
    district_type = forms.CharField(validators=[validate_district_types])


class EmailAlertDistrict(forms.Form):
    coun_dist = forms.CharField(required=False)
    nta = forms.CharField(required=False)
    community_dist = forms.CharField(required=False)
    assem_dist = forms.CharField(required=False)
    stsen_dist = forms.CharField(required=False)
    zipcode = forms.CharField(required=False)
    census_tract = forms.CharField(required=False)
