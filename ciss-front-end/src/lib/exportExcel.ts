import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MonitoringEntry, MonitoringStatistics } from '@/types/monitoring_status';

export async function exportErrorDataToExcel(
  statistics: MonitoringStatistics,
  selectedCodes: string[],
  fullErrorList: MonitoringEntry[]
) {
  const workbook = new ExcelJS.Workbook();

  // 시트 1: Error Statistics
  const statSheet = workbook.addWorksheet('Error Statistics');
  statSheet.columns = [
    { header: 'Error Code', key: 'code', width: 30 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Percent (of selected)', key: 'percent', width: 20 },
  ];

  const selectedTotal = selectedCodes.reduce(
    (acc, code) => acc + (statistics.errorCodeCounts[code] || 0),
    0
  );

  selectedCodes.forEach(code => {
    const count = statistics.errorCodeCounts[code] || 0;
    const percent = selectedTotal ? ((count / selectedTotal) * 100).toFixed(2) : '0.00';
    statSheet.addRow({ code, count, percent: `${percent}%` });
  });

  statSheet.addRow({ code: 'Total', count: selectedTotal, percent: '100%' });

  // 시트 2: Full Recent Errors
  const errorSheet = workbook.addWorksheet('Recent Errors');
  errorSheet.columns = [
    { header: 'Serial No', key: 'serialNo', width: 25 },
    { header: 'Error Code', key: 'errorCode', width: 20 },
    { header: 'DP-STATE', key: 'dpState', width: 20 },
    { header: 'LEFT SEQ-NAME', key: 'seq1', width: 20 },
    { header: 'RIGHT SEQ-NAME', key: 'seq2', width: 20 },
    { header: 'Time', key: 'time', width: 30 },
  ];

  fullErrorList.forEach(entry => {
    errorSheet.addRow({
      serialNo: entry.serialNo,
      errorCode: entry['ERR-CODE'],
      dpState: entry['DP-STATE'],
      seq1: entry['ING-SEQ-NAME'],
      seq2: entry['ING2-SEQ-NAME'],
      time: new Date(entry.generatedAt).toLocaleString(),
    });
  });

  // 파일 저장
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, 'error_analysis.xlsx');
}
