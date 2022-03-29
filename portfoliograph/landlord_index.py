def update_landlord_algolia_index(conn):
    # TODO: Check whether wow_portfolios table has changed
    cleaned_rows = []
    with conn.cursor() as cursor:
        cursor.execute(
            f"""
            SELECT
                array_to_string(landlord_names,', ') as landlord_names,
                bbls[1] as bbl
            FROM
                wow_portfolios
            WHERE bbls[1] is not null;
        """
        )
    for row in cursor.fetchall():
        if len(row["landlord_names"]) > 2000:
            names_array = row["landlord_names"].split(', ')
            first_half = names_array[:len(names_array)//2]
            second_half = names_array[len(names_array)//2:]
            first_half_string = ', '.join(first_half)
            second_half_string = ', '.join(second_half)
            new_row_1 = {"bbl": row["bbl"], "landlord_names": first_half_string}
            new_row_2 = {"bbl": row["bbl"], "landlord_names": second_half_string}
            cleaned_rows.append(new_row_1).append(new_row_2)
        else:
            cleaned_rows.append(row)

    # 3. Check if stringifued ll_names is longer than 2000 character 
    # 4. Upload CSV to Algolio as new index

    outfile.write("[\n")
    components_written = 0

    for pr in iter_portfolio_rows(conn):
        if components_written > 0:
            outfile.write(",\n")
        outfile.write(json.dumps(pr.to_json()))
        components_written += 1

    outfile.write("]\n")