from django import forms
from django.core.validators import RegexValidator


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


class EmailAlertForm(PaddedBBLForm):
    start_date = forms.DateField(input_formats="%Y-%m-%d", required=True)
    end_date = forms.DateField(input_formats="%Y-%m-%d", required=True)
