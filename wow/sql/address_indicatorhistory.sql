WITH TIME_SERIES AS (
      SELECT TO_CHAR(I::DATE , 'YYYY-MM') AS MONTH 
      FROM GENERATE_SERIES('2010-01-01', CURRENT_DATE - INTERVAL '1 MONTH', '1 MONTH'::INTERVAL) I
    ),
    
    HPDVIOLATIONS AS (
      SELECT
        TO_CHAR(COALESCE(NOVISSUEDDATE, INSPECTIONDATE), 'YYYY-MM') AS MONTH,
        COUNT(*) FILTER (WHERE CLASS = 'A') AS HPDVIOLATIONS_CLASS_A,
        COUNT(*) FILTER (WHERE CLASS = 'B') AS HPDVIOLATIONS_CLASS_B,
        COUNT(*) FILTER (WHERE CLASS = 'C') AS HPDVIOLATIONS_CLASS_C,
        COUNT(*) FILTER (WHERE CLASS = 'I') AS HPDVIOLATIONS_CLASS_I,
        COUNT(*) FILTER (WHERE CLASS IS NOT NULL) AS HPDVIOLATIONS_TOTAL
      FROM HPD_VIOLATIONS
      WHERE BBL = %(bbl)s
      AND COALESCE(NOVISSUEDDATE, INSPECTIONDATE) >= '2010-01-01'
      GROUP BY MONTH
    ),

    HPDCOMPLAINTS AS (
      SELECT 
        TO_CHAR(RECEIVEDDATE, 'YYYY-MM') AS MONTH, 
        COUNT(*) FILTER (WHERE TYPEID = ANY('{1,2,4}')) AS HPDCOMPLAINTS_EMERGENCY,
        COUNT(*) FILTER (WHERE TYPEID = ANY('{3,8}')) AS HPDCOMPLAINTS_NONEMERGENCY,
        COUNT(*) FILTER (WHERE TYPEID IS NOT NULL) AS HPDCOMPLAINTS_TOTAL
      FROM HPD_COMPLAINT_PROBLEMS P
      LEFT JOIN HPD_COMPLAINTS C ON P.COMPLAINTID = C.COMPLAINTID
      WHERE BBL = %(bbl)s
      AND RECEIVEDDATE >= '2010-01-01'
      GROUP BY MONTH
    ),

    DOBPERMITS AS (
      SELECT 
          TO_CHAR(PREFILINGDATE, 'YYYY-MM') AS MONTH, 
          COUNT(*) FILTER (WHERE JOBTYPE IS NOT NULL) AS DOBPERMITS_TOTAL
      FROM DOBJOBS
      WHERE BBL = %(bbl)s
      AND PREFILINGDATE >= '2010-01-01'
      GROUP BY MONTH
    ),

    REGULARDOBVIOLATIONS AS (
      SELECT
          TO_CHAR(ISSUEDATE, 'YYYY-MM') AS MONTH,
          COUNT(*) FILTER (WHERE VIOLATIONTYPECODE IS NOT NULL) REGULARDOBVIOLATIONS_TOTAL
      FROM DOB_VIOLATIONS
      WHERE BBL = %(bbl)s
      AND ISSUEDATE >= '2010-01-01'
      GROUP BY MONTH
    ),

    ECBVIOLATIONS AS (
      SELECT
          TO_CHAR(ISSUEDATE, 'YYYY-MM') AS MONTH,
          COUNT(*) FILTER (WHERE SEVERITY IS NOT NULL) AS ECBVIOLATIONS_TOTAL
      FROM ECB_VIOLATIONS
      WHERE BBL = %(bbl)s
      AND ISSUEDATE >= '2010-01-01'
      GROUP BY MONTH
    ),

    OCAEVICTIONS AS (
      SELECT
        MONTH,
        EVICTIONFILINGS
      FROM OCA_EVICTIONS_MONTHLY
      WHERE BBL = %(bbl)s
    )

  SELECT 
      T.MONTH,
      COALESCE(HPDVIOLATIONS_CLASS_A, 0) AS HPDVIOLATIONS_CLASS_A,
      COALESCE(HPDVIOLATIONS_CLASS_B, 0) AS HPDVIOLATIONS_CLASS_B,
      COALESCE(HPDVIOLATIONS_CLASS_C, 0) AS HPDVIOLATIONS_CLASS_C,
      COALESCE(HPDVIOLATIONS_CLASS_I, 0) AS HPDVIOLATIONS_CLASS_I,
      COALESCE(HPDVIOLATIONS_TOTAL, 0) AS HPDVIOLATIONS_TOTAL,
      COALESCE(HPDCOMPLAINTS_EMERGENCY, 0) AS HPDCOMPLAINTS_EMERGENCY,
      COALESCE(HPDCOMPLAINTS_NONEMERGENCY, 0) AS HPDCOMPLAINTS_NONEMERGENCY,
      COALESCE(HPDCOMPLAINTS_TOTAL, 0) AS HPDCOMPLAINTS_TOTAL,
      COALESCE(DOBPERMITS_TOTAL, 0) AS DOBPERMITS_TOTAL,
      -- Combine Regular DOB Violations and ECB Violations into one grouping called "DOBVIOLATIONS"
      COALESCE(REGULARDOBVIOLATIONS_TOTAL, 0) AS DOBVIOLATIONS_REGULAR,
      COALESCE(ECBVIOLATIONS_TOTAL, 0) AS DOBVIOLATIONS_ECB,
      COALESCE(REGULARDOBVIOLATIONS_TOTAL, 0) + COALESCE(ECBVIOLATIONS_TOTAL, 0) AS DOBVIOLATIONS_TOTAL,
      EVICTIONFILINGS
      -- ----------------------------------------------------------------------------------------------
  FROM TIME_SERIES T
  LEFT JOIN HPDVIOLATIONS HV ON T.MONTH = HV.MONTH
  LEFT JOIN HPDCOMPLAINTS HC ON T.MONTH = HC.MONTH
  LEFT JOIN DOBPERMITS DP ON T.MONTH = DP.MONTH
  LEFT JOIN REGULARDOBVIOLATIONS RDV ON T.MONTH = RDV.MONTH
  LEFT JOIN ECBVIOLATIONS EV ON T.MONTH = EV.MONTH
  LEFT JOIN OCAEVICTIONS OCA ON T.MONTH = OCA.MONTH
  ORDER BY T.MONTH ASC
