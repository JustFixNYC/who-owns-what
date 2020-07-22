from typing import Dict, Any
import functools
from django.http import JsonResponse


class InvalidFormError(Exception):
    def __init__(self, form):
        self.form_errors = form.errors.get_json_data()

    def as_json_response(self):
        return JsonResponse({
            'error': 'Bad request',
            'validationErrors': self.form_errors,
        }, status=400)


def apply_cors_policy(request, response):
    response['Access-Control-Allow-Origin'] = '*'
    return response


def api(fn):
    '''
    Decorator for an API endpoint.
    '''

    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        request.is_api_request = True
        try:
            response = fn(request, *args, **kwargs)
        except InvalidFormError as e:
            response = e.as_json_response()
        return apply_cors_policy(request, response)

    return wrapper


def get_validated_form_data(form_class, data) -> Dict[str, Any]:
    form = form_class(data)
    if not form.is_valid():
        raise InvalidFormError(form)
    return form.cleaned_data


def is_api_request(request) -> bool:
    return getattr(request, 'is_api_request', False)
