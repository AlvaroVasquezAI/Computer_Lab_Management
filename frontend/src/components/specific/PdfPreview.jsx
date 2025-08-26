import React from 'react';

const PdfPreview = ({ file }) => {
    return (
        <div className="pdf-preview-wrapper">
            <embed src={file} type="application/pdf" className="pdf-embed" />
        </div>
    );
};

export default PdfPreview;