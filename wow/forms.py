from django import forms
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError


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


class EmailAlertBuilding(PaddedBBLForm):
    start_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    end_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    prev_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    oldest_filed_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)

    def clean(self):
        data = self.cleaned_data

        if not data.get("start_date", None):
            raise forms.ValidationError(
                "start_date is required for violations, complaints, and eviction_filings"
            )
        if not data.get("end_date", None):
            raise forms.ValidationError(
                "end_date is required for violations, complaints, and eviction_filings"
            )
        if not data.get("prev_date", None):
            raise forms.ValidationError(
                "prev_date is required for lagged_eviction_filings"
            )
        if not data.get("oldest_filed_date", None):
            raise forms.ValidationError(
                "oldest_filed_date is required for lagged_eviction_filings"
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
        "borough",
        "community_dist",
        "cong_dist",
        "assem_dist",
        "stsen_dist",
        "zipcode",
    ]
    if not value in VALID_DISTRICTS:
        raise ValidationError(
            f"{value} is not a valid district type. Must be on of {', '.join(VALID_DISTRICTS)}",
        )


class DistrictTypeForm(forms.Form):
    district_type = forms.CharField(validators=[validate_district_types])
