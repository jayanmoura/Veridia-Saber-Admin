export const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            // Handle various types and escape quotes
            let stringVal = '';
            if (val === null || val === undefined) {
                stringVal = '';
            } else if (typeof val === 'object') {
                // Try to extract meaningful string from object logic if needed, otherwise stringify
                stringVal = JSON.stringify(val).replace(/"/g, '""');
            } else {
                stringVal = String(val).replace(/"/g, '""');
            }
            return `"${stringVal}"`;
        }).join(','))
    ].join('\n');

    // Trigger download with BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
