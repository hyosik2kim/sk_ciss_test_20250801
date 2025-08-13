import chardet
import copy
import os

from SCARCommon import *

from concurrent.futures import ThreadPoolExecutor
from parse import *

def info(log):
    if log[:1] == '\n':
        print('')
        log = log.replace('\n', '')

    print(f'[{now()}] [SCARAnalyzer] {log}')

class SCARAnalyzer :

    analyzeCompleted = None

    def __init__(self):
        self.runAnalyze = False

        self.ocppReqMsg = '================> ['
        self.ocppResMsg = '<================ ['
        self.keyMsgs    = [ 'CORE LIB START',
                            'ws connected',
                            'ws disconnected',
                            'Push Stop Button',
                            'Emergency Button emeStatus',
                            'VPOS -> HMI NAYAX < Vend',
                            '"TransactionEvent",',
                            '"RequestStartTransaction",',
                            '"RequestStopTransaction",',
                            '"Authorize",',
                            '"StatusNotification",',
                            '"NotifyEvent",',
                            ', Plug in for id',
                            ', Plug Out for id',
                            'RECV MAINBOARD STATUS index',
                            'evse prev status :',
                            'evse aftr status :',
                            'mbStatusProcessing',
                            '] Sequence Name1 ['    ]
        
    def set_analyze_completed_callback(self, callback):
        self.analyzeCompleted = callback

    def run(self):
        while True:
            if self.runAnalyze == True:
                Analyzed().clear()
                self.analyze()
                self.runAnalyze = False
            else:
                self.sleep(1)

    def requestAnalyze(self):
        self.runAnalyze = True

    def analyze(self):
        print('')

        if len(LogList().srcDicts) <= 0:
            info(f'No Files [{Config().logPath}]')
            return

        if Config().logPath != None and len(Config().logPath) > 0:
            cpu_count = os.cpu_count()
            max_workers = cpu_count * 2

            info(f'Path [{Config().logPath}] Thread [{max_workers}]')

            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                for srcName, srcFiles in LogList().srcDicts.items():
                    executor.submit(self.analyzeSrc, srcName, srcFiles)

    def analyzeSrc(self, name, files):
        # info(f'Analyze - Src [{name}] Files [{len(files)}]')
        Analyzed().remove(name)
        Analyzed().set(name, AnalyzeInfo())

        partialAnalyzed = 0

        # info(f'analyzeSrc - Src [{name}] Logs [{len(Analyzed().get(name).logs)}] Start')

        for file in files:
            # 대상 파일별 로그 수집
            # info(f'Analyze - Start :: Src [{name}] File [{file}]')
            self.analyzeFile(name, file)

            partialAnalyzed += 1
            if partialAnalyzed == len(files):
                self.result(name)
            if self.analyzeCompleted :
                self.analyzeCompleted(name, (partialAnalyzed == len(files)))

            # info(f'Analyze - End   :: Src [{name}] Logs [{len(Analyzed().get(name).logs)}] Completed [{partialAnalyzed == len(files)}]')

    # 로그 처리
    def analyzeFile(self, name, file):
        fileEncoding = None
        try:
            lineCount = 0

            with open(file, 'rb') as f:
                result = chardet.detect(f.read())
                fileEncoding = result['encoding']

            with open(file, 'r', encoding=fileEncoding) as f:
                while True:
                    line = f.readline()
                    if len(line) == 0 or self.analyzeLog(name, line) == False:
                        break

                    lineCount += 1

        except Exception as e:
            info(f'analyzeFile - Exception [{file}] [{e}]')

        info(f'Src [{name}] File [{file}] Encode [{fileEncoding}] Line [{lineCount}]')

    # 특정 로그 확인
    def analyzeLog(self, name, log):
        try:
            logElements = []

            if log == None or len(log) <= 0 or log == '\n':
                return True

            elif log.find(':00][') <= 0:
                if Analyzed().get(name).prevLog[LogElement.MESSAGE].find(self.ocppReqMsg) >= 0 or \
                   Analyzed().get(name).prevLog[LogElement.MESSAGE].find(self.ocppResMsg) >= 0:
                    Analyzed().get(name).prevLog[LogElement.MESSAGE] = '['

                Analyzed().get(name).prevLog[LogElement.MESSAGE] += log.replace('\n', '').strip()
                logElements = Analyzed().get(name).prevLog

                if len(log) > 2 or log[0] != ']':
                    return True

            else:
                # info(f'analyzeLog - 1')
                Analyzed().get(name).prevLog.clear()
                # info(f'analyzeLog - 2')

                tempLog = ''
                if log.startswith('[') == True:
                    tempLog = log.replace('[', '', 1)

                # info(f'analyzeLog - 3')
                if tempLog.find('][') >= 0:
                    logs = tempLog.split('][', maxsplit=1)
                    rawTime = logs[0]
                    rawLog  = logs[1]

                    # info(f'analyzeLog - 4')
                    rawMsg = ''
                    if rawLog.find('[F3] ') >= 0:
                        rawMsg = rawLog.split('[F3] ', maxsplit=1)[1]
                    if rawLog.find('[F1] ') >= 0:
                        rawMsg = rawLog.split('[F1] ', maxsplit=1)[1]

                    if len(rawTime) > 0 and len(rawMsg) > 0:
                        logElements.append(rawTime)                             # time
                        logElements.append(rawMsg.replace('\n', '').strip())    # message
                        logElements.append(log.replace('\n', '').strip())       # origin

                # info(f'analyzeLog - 5')

            Analyzed().get(name).prevLog = logElements
            if len(logElements) >= int(LogElement.ORIGIN) and \
               logElements[LogElement.MESSAGE].find(self.ocppReqMsg) < 0 and \
               logElements[LogElement.MESSAGE].find(self.ocppResMsg) < 0 and \
               logElements[LogElement.ORIGIN].find('[OFFLINE]') < 0:
                if self.analyzeMsg(name, logElements) == False:
                    return False

        except Exception as e:
            info(f'analyzeLog - Exception [{e}] : [{log}]')
            return False

        return True

    def analyzeMsg(self, name, logElements):
        logInfo = LogInfo()
        message = logElements[LogElement.MESSAGE]

        Analyzed().get(name).matched = 0
        for index, key in enumerate(self.keyMsgs):
            if message.find(key) >= 0:
                logInfo.strDateTime = logElements[LogElement.TIME]
                Analyzed().get(name).matched = 1

                try:
                    if key == 'CORE LIB START':
                        logInfo.strEVSEEvent = 'Start App'

                    elif key == 'ws connected':
                        logInfo.strEVSEEvent = 'WS Connected'

                    elif key == 'ws disconnected':
                        logInfo.strEVSEEvent = 'WS Disconnected'

                    elif key == 'Push Stop Button':
                        logInfo.strEVSEEvent = 'User Stop'

                    elif key == 'Emergency Button emeStatus':
                        currentStatus = parse('{etc}Emergency Button emeStatus {emergencyStatus}', message)
                        if currentStatus['emergencyStatus'] == '1':
                            logInfo.strEVSEEvent = f'Emergency On'
                        elif currentStatus['emergencyStatus'] == '0':
                            logInfo.strEVSEEvent = f'Emergency Off'

                        if Analyzed().get(name).prevEmergency == logInfo.strEVSEEvent:
                            Analyzed().get(name).matched = 0
                        else:
                            Analyzed().get(name).prevEmergency = logInfo.strEVSEEvent

                    elif key == 'VPOS -> HMI NAYAX < Vend':
                        currentStatus = parse('VPOS -> HMI NAYAX < Vend {paymentStatus}', message)
                        logInfo.strEVSEEvent = f"Nayax {currentStatus['paymentStatus']}"

                    elif key == '"TransactionEvent",':
                        uuid, transactionEvent = parseJson(message)
                        if len(uuid) <= 0:
                            return True

                        ocppMessage = parseTransactionReq(transactionEvent)
                        ocppMessage.strMessageId = 'TransactionEvent'
                        ocppMessage.strUUID = uuid

                        logInfo.ocppMessage = ocppMessage

                        if ocppMessage.strEventType == 'Updated' and ocppMessage.strTriggerReason == 'MeterValuePeriodic':
                            return True

                        Analyzed().get(name).ocppUUIDs[uuid] = 'TransactionEvent'

                    elif key == '"RequestStartTransaction",':
                        uuid, requestStartTransaction = parseJson(message)
                        if len(uuid) <= 0:
                            return True

                        Analyzed().get(name).ocppUUIDs[uuid] = 'RequestStartTransaction'
                        ocppMessage = parseRequestStartReq(requestStartTransaction)
                        ocppMessage.strMessageId = 'RequestStartTransaction'
                        ocppMessage.strUUID = uuid

                        logInfo.ocppMessage = ocppMessage

                    elif key == '"RequestStopTransaction",':
                        uuid, requestStopTransaction = parseJson(message)
                        if len(uuid) <= 0:
                            return True

                        Analyzed().get(name).ocppUUIDs[uuid] = 'RequestStopTransaction'
                        ocppMessage = parseRequestStopReq(requestStopTransaction)
                        ocppMessage.strMessageId = 'RequestStopTransaction'
                        ocppMessage.strUUID = uuid

                        logInfo.ocppMessage = ocppMessage

                    elif key == '"Authorize",':
                        uuid, authorize = parseJson(message)
                        if len(uuid) <= 0:
                            return True

                        Analyzed().get(name).ocppUUIDs[uuid] = 'Authorize'
                        ocppMessage = parseAuthorizeReq(authorize)
                        ocppMessage.strMessageId = 'Authorize'
                        ocppMessage.strUUID = uuid

                        logInfo.ocppMessage = ocppMessage

                    elif key == '"StatusNotification",':
                        uuid, notification = parseJson(message)
                        if len(uuid) <= 0:
                            return True

                        ocppMessage = parseNotificationReq(notification)
                        connectorInfo = ConnectorInfo()
                        connectorInfo.strNotification = ocppMessage.strEventType
                        if ocppMessage.strConnectorId == '1':
                            logInfo.connector1 = connectorInfo
                        elif ocppMessage.strConnectorId == '2':
                            logInfo.connector2 = connectorInfo

                    elif key == '"NotifyEvent",':
                        uuid, notify = parseJson(message)
                        if len(uuid) <= 0:
                            return True

                        ocppMessage = parseNotifyReq(notify)
                        ocppMessage.strMessageId = 'NotifyEvent'
                        ocppMessage.strUUID = uuid

                        logInfo.ocppMessage = ocppMessage

                    elif key == ', Plug in for id':
                        connectorStatus = parse('{etc}Plug in for id {connectorId}', message)
                        connectorInfo = ConnectorInfo()
                        connectorInfo.nConnection = 1

                        if int(connectorStatus['connectorId']) == 1:
                            logInfo.connector1 = connectorInfo
                        else:
                            logInfo.connector2 = connectorInfo

                    elif key == ', Plug Out for id':
                        connectorStatus = parse('{etc}Plug Out for id {connectorId}', message)
                        connectorInfo = ConnectorInfo()
                        connectorInfo.nConnection = 2

                        if int(connectorStatus['connectorId']) == 1:
                            logInfo.connector1 = connectorInfo
                        else:
                            logInfo.connector2 = connectorInfo

                    elif key == 'RECV MAINBOARD STATUS index':
                        evseStatus = parse('{etc1}RECV MAINBOARD STATUS index ({mainboardIndex}) connectorId({connectorId}){etc2}', message)
                        Analyzed().get(name).connectorId = int(evseStatus['connectorId'])
                        Analyzed().get(name).matched = 2

                    elif key == 'evse prev status :' and Analyzed().get(name).connectorId != 0:
                        evseStatus = parse('evse prev status : {connectorStatus}', message)
                        if Analyzed().get(name).connectorId != 0:
                            connectorInfo = ConnectorInfo()
                            connectorInfo.strPreviousStatus = evseStatus['connectorStatus']

                            if Analyzed().get(name).connectorId == 1:
                                logInfo.connector1 = connectorInfo
                            else:
                                logInfo.connector2 = connectorInfo

                    elif key == 'evse aftr status :' and Analyzed().get(name).connectorId != 0:
                        evseStatus = parse('evse aftr status : {connectorStatus}', message)
                        if Analyzed().get(name).connectorId != 0:
                            connectorInfo = ConnectorInfo()
                            connectorInfo.strCurrentStatus = evseStatus['connectorStatus']

                            if Analyzed().get(name).connectorId == 1:
                                logInfo.connector1 = connectorInfo
                            else:
                                logInfo.connector2 = connectorInfo
                            Analyzed().get(name).connectorId = 0

                    elif key == 'mbStatusProcessing':
                        currentConnector = {}
                        if message.find('connectorId : [') > 0:
                            currentConnector = parse('{etc1}connectorId : [{connectorId}]{etc2}', message)
                        elif message.find('connectorId [') > 0:
                            currentConnector = parse('{etc1}connectorId [{connectorId}]{etc2}', message)

                        if currentConnector:
                            Analyzed().get(name).connectorId = int(currentConnector['connectorId'])

                        currentCode = parse('{etc1}errorCode [{fault}] errorCodePLC [{faultPLC}] finishCode [{finish}]{etc2}', message)
                        if currentCode != None and Analyzed().get(name).connectorId != 0:
                            connectorInfo = ConnectorInfo()
                            connectorInfo.strCodeFinish   = currentCode['finish']
                            connectorInfo.strCodeError    = currentCode['fault']
                            connectorInfo.strCodeErrorPLC = currentCode['faultPLC']

                            if Analyzed().get(name).connectorId == 1:
                                logInfo.connector1 = connectorInfo
                            else:
                                logInfo.connector2 = connectorInfo

                            # info(f'Log [{len(Analyzed().get(name).logs)}] - ConnectorId [{Analyzed().get(name).connectorId}] Finish [{connectorInfo.strCodeFinish}] Error [{connectorInfo.strCodeError}] PLC [{connectorInfo.strCodeErrorPLC}]')
                            Analyzed().get(name).connectorId = 0
                        else:
                            return True

                    elif key == '] Sequence Name1 [':
                        sequenceName = parse('{etc}ConnectorId [{connectorId}] Sequence Name1 [{sBit1}] [{sInt1}] Sequence Name2 [{sBit2}] [{sInt2}]', message)
                        if sequenceName is not None:
                            connectorInfo = ConnectorInfo()

                            connectorInfo.strSequenceName1 = sequenceName['sBit1']
                            connectorInfo.strSequenceName2 = sequenceName['sBit2']

                            if sequenceName['connectorId'] == '1':
                                logInfo.connector1 = connectorInfo
                            else:
                                logInfo.connector2 = connectorInfo

                except Exception as e:
                    info(f'analyzeMsg #1 - Exception [{e}] [{message}]')
                    return False

                break

        if Analyzed().get(name).matched == 0 and logElements[LogElement.ORIGIN].find('dspmanager.cpp:') >= 0:
            if message == 'init' or message == 'CommunicationStart' or message == 'start' or message == 'stop':
                logInfo.strDateTime = logElements[LogElement.TIME]
                if message == 'init':
                    logInfo.strCommand = 'Init'
                elif message == 'CommunicationStart':
                    logInfo.strCommand = 'Comm.Start'
                elif message == 'start':
                    logInfo.strCommand = 'Start'
                elif message == 'stop':
                    logInfo.strCommand = 'Stop'
                Analyzed().get(name).matched = 1

        if Analyzed().get(name).matched == 0:
            if message.find('"NotifyReport"') > 0 or isJson(message) == False:
                return True

            try:
                uuid, ocppMessage = parseJson(message, res=True)
                if len(uuid) > 0:
                    for key, value in Analyzed().get(name).ocppUUIDs.items():
                        if uuid.find(key) >= 0:
                            for index, logInfo in enumerate(Analyzed().get(name).logs):
                                if type(logInfo) == LogInfo and logInfo.ocppMessage.strUUID == uuid and logInfo.ocppMessage.strMessageId == value:
                                    msgId = Analyzed().get(name).logs[index].ocppMessage.strMessageId

                                    prevLogInfo = None
                                    prevLogInfo = copy.deepcopy(Analyzed().get(name).logs[index])

                                    if prevLogInfo != None:
                                        shortTime = parse('{date} {time}-{zone}', logElements[LogElement.TIME])

                                        if msgId == 'TransactionEvent':
                                            prevLogInfo.ocppMessage.strResponse = f"{shortTime['time']} {parseTransactionRes(ocppMessage).strResponse}"
                                        elif msgId == 'RequestStartTransaction':
                                            prevLogInfo.ocppMessage.strResponse = f"{shortTime['time']} {parseRequestStartRes(ocppMessage).strResponse}"
                                        elif msgId == 'RequestStopTransaction':
                                            prevLogInfo.ocppMessage.strResponse = f"{shortTime['time']} {parseRequestStopRes(ocppMessage).strResponse}"
                                        elif msgId == 'Authorize':
                                            prevLogInfo.ocppMessage.strResponse = f"{shortTime['time']} {parseAuthorizeRes(ocppMessage).strResponse}"

                                        if len(prevLogInfo.ocppMessage.strResponse) > 0:
                                            prevLogInfo.ocppMessage.strResponseTime = logElements[LogElement.TIME]
                                        if len(prevLogInfo.ocppMessage.strResponse) > 0:
                                            Analyzed().setLogs(name, index, prevLogInfo)

                                    break

                            Analyzed().get(name).matched = 2
                            del Analyzed().get(name).ocppUUIDs[uuid]
                            break

            except Exception as e:
                info(f'analyzeMsg #2 - Exception [{e}] [{message}]')
                return False

        if Analyzed().get(name).matched != 0:
            try:
                if Analyzed().get(name).matched == 1:
                    Analyzed().append(name, logInfo)

                rawLog = f'[{logElements[LogElement.TIME]}] {logElements[LogElement.MESSAGE]}'
                Analyzed().append(name, rawLog)

            except Exception as e:
                info(f'analyzeMsg #3 - Exception [{e}] [{message}]')
                return False

        return True

    def result(self, name):
        logFile = ''
        if len(name) > 0:
            logFile = f'{name}{Config().dstFile}'
        else:
            logFile = f'analyze{Config().dstFile}'

        logResult = os.path.join(Config().logPath, logFile)
        # info(f'result - file [{logFile}] len [{len(Analyzed().get(name).rawLogs)}] result [{logResult}]')

        with open(logResult, 'w') as f:
            for rawLog in Analyzed().get(name).rawLogs:
                f.write(rawLog + '\n')

        return logResult

