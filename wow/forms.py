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


def validate_indicators(value):
    valid_indicators = ["violations", "complaints", "eviction_filings"]
    for i in value:
        if i not in valid_indicators:
            raise ValidationError(
                "Indicators must be comma-separated list of: 'violations',\
                'complaints', or 'eviction_filings'"
            )


class EmailAlertForm(PaddedBBLForm):
    indicator = forms.CharField(
        validators=[
            RegexValidator(
                r"^(violations)|(complaints)|(eviction_filings)$",
                message="This must be one of 'violations', 'complaints', 'eviction_filings'.",
            )
        ],
        required=False,
    )
    indicators = CommaSeparatedField(validators=[validate_indicators], required=False)
    start_date = forms.DateField(input_formats=["%Y-%m-%d"])
    end_date = forms.DateField(input_formats=["%Y-%m-%d"])
