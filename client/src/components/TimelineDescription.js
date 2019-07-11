import React from 'react';

const TimelineDescription = (props) => {
    return (
        (props.activeVis === 'hpd_complaints' ? 
            <span>HPD Complaints are housing issues reported to the City <b>by a tenant calling 311</b>.
            When someone issues a complaint, the Department of Housing Preservation and Development begins a process of investigation that may lead to an official violation from the City.
            Complaints can be identified as:<br/>
            <br/>
            <b>Emergency</b> — reported to be hazardous/dire<br/>
            <b>Non-Emergency</b> — all others<br/>
            <br/>  
            Read more about HPD Complaints and how to file them at the <a href='https://www1.nyc.gov/site/hpd/renters/hpd_complaints-and-inspections.page' target="_blank" rel="noopener noreferrer">official HPD page</a>.</span> 
        : props.activeVis === 'hpd_violations' ?
            <span>HPD Violations occur when an official City Inspector finds the conditions of a home in violation of the law. 
            If not corrected, these violations incur fines for the owner— however, HPD violations are notoriously unenforced by the City.
            HPD Violations fall into three categories:<br/>
            <br/>
            <b>Class A</b> — non-hazardous<br/>
            <b>Class B</b> — hazardous<br/>
            <b>Class C</b> — immediately hazardous<br/>
            <br/>
            Read more about HPD Violations at the <a href='https://www1.nyc.gov/site/hpd/owners/compliance-maintenance-requirements.page' target="_blank" rel="noopener noreferrer">official HPD page</a>.</span>
        : props.activeVis === 'dob_permits' ? 
            <span>Owners submit Building Permit Applications to the Department of Buildings before any construction project to get necessary approval.
            The number of applications filed can indicate how much construction the owner was planning.
            <br/>
            <br/> 
            Read more about DOB Building Applications/Permits at the <a href='https://www1.nyc.gov/site/buildings/about/building-applications-and-dob_permits.page' target="_blank" rel="noopener noreferrer">official NYC Buildings page</a>.</span>
        : props.activeVis === 'dob_violations' ?
            <span>A DOB Violation is a notice that a property is not in compliance with some building law.
            It includes an order from the Department of Buildings to correct the violating condition, which must be corrected before a new or amended Certificate of Occupancy (CO) can be obtained. 
            DOB Violations are generally considered less severe than ECB violations, and can be identified as:<br/>
            <br/>
            <b>Emergency</b> — critical building situation<br/>
            <b>Non-Emergency</b> — all others<br/>
            <br/>
            Read more about Building Violations at the <a href='https://www1.nyc.gov/site/buildings/safety/dob-violations.page' target="_blank" rel="noopener noreferrer">official DOB page</a>.</span>
        : props.activeVis === 'ecb_violations' ?
            <span>Like DOB Violations, ECB (Environmental Control Board) Violations occur when a property does not comply with building code or zoning law. 
            However, people named in an ECB violation must first attend a hearing with the Office of Administrative Trials and Hearings to pay a fine or have the violation dismissed. 
            For that reason, ECB Violations are generally considered more severe than DOB Violations.
            <br/>
            <br/> 
            Read more about ECB Violations at the <a href='https://www1.nyc.gov/site/buildings/safety/ecb-violations.page' target="_blank" rel="noopener noreferrer">official City page</a>.</span>
        :<span/>
        )
    );
};

export default TimelineDescription; 