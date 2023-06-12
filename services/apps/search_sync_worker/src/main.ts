import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, SQS_CONFIG } from './conf'
import { OpenSearchService } from './service/opensearch.service'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const openSearchService = new OpenSearchService(log)

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const worker = new WorkerQueueReceiver(
    sqsClient,
    dbConnection,
    openSearchService,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await openSearchService.initialize()
    await worker.start()
  } catch (err) {
    log.error(err, 'Failed to start!')
    process.exit(1)
  }
})