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
    # "hpd_link" included here for email alerts api, this is temporary until we refactor
    # this to use a pre-built table with all values instead of this composable option
    valid_indicators = [
        "violations",
        "complaints",
        "eviction_filings",
        "lagged_eviction_filings",
        "hpd_link",
    ]
    for i in value:
        if i not in valid_indicators:
            raise ValidationError(
                "Indicators must be comma-separated list of: 'violations',\
                'complaints', 'eviction_filings', 'lagged_eviction_filings', or 'hpd_link"
            )


class EmailAlertViolationsForm(PaddedBBLForm):
    start_date = forms.DateField(input_formats=["%Y-%m-%d"])
    end_date = forms.DateField(input_formats=["%Y-%m-%d"])


class EmailAlertLaggedEvictionFilingsForm(PaddedBBLForm):
    prev_date = forms.DateField(input_formats=["%Y-%m-%d"])


class EmailAlertSingleIndicatorForm(PaddedBBLForm):
    regex = r"^(violations)|(complaints)|(eviction_filings)|(lagged_eviction_filings)|(hpd_link)$"
    indicator = forms.CharField(
        validators=[
            RegexValidator(
                regex,
                message="This must be one of 'violations', 'complaints', 'eviction_filings', \
                    'lagged_eviction_filings', 'hpd_link'.",
            )
        ]
    )
    start_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    end_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    prev_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)

    def clean(self):
        data = self.cleaned_data
        indicator = data.get("indicator", None)

        if indicator == "lagged_eviction_filings" and not data.get("prev_date", None):
            raise forms.ValidationError(
                "prev_date is required for lagged_eviction_filings"
            )
        elif indicator != "lagged_eviction_filings":
            if not data.get("start_date", None):
                raise forms.ValidationError(
                    "start_date is required for violations, complaints, and eviction_filings"
                )
            if not data.get("end_date", None):
                raise forms.ValidationError(
                    "end_date is required for violations, complaints, and eviction_filings"
                )
        else:
            return data


class EmailAlertMultiIndicatorForm(PaddedBBLForm):
    indicators = CommaSeparatedField(validators=[validate_indicators])
    start_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    end_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)
    prev_date = forms.DateField(input_formats=["%Y-%m-%d"], required=False)

    def clean(self):
        data = self.cleaned_data
        indicators = data.get("indicators", [])
        start_end_indicators = ["violations", "complaints", "eviction_filings"]

        if indicators == ["hpd_link"]:
            return data

        if "lagged_eviction_filings" in indicators:
            if not data.get("prev_date", None):
                raise forms.ValidationError(
                    "prev_date is required for lagged_eviction_filings"
                )
        if not set(start_end_indicators).isdisjoint(indicators):
            if not data.get("start_date", None):
                raise forms.ValidationError(
                    "start_date is required for violations, complaints, and eviction_filings"
                )
            if not data.get("end_date", None):
                raise forms.ValidationError(
                    "end_date is required for violations, complaints, and eviction_filings"
                )

        return data

# TODO: what if any validation can/should we do?
class SignatureGroupForm(forms.Form):
    group = forms.CharField()
