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
            These Violations fall into three categories:<br/>
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
        : <span/>
        )
    );
};

export default TimelineDescription; 