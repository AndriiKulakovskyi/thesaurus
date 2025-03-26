"""Module containing datetime utils functions"""
import datetime

def convert_datestring_to_datetime_object(date_string: str):
    """Convertit les dates de format 'YYYY-MM-DD' en timestamp"""
    date_array = date_string.split('-')
    year, month, day = (int(date_array[0]), int(date_array[1]), int(date_array[2]))
    return datetime.datetime(year, month, day)

def convert_timestamptz(timestamptz: str, target_format: str):
    """Convertit un timestamp vers le format de string souhaité"""
    if target_format == "YYYY-MM-DD":
        date = timestamptz.split('T')[0]
        return date
    return timestamptz
