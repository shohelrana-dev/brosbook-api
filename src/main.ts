//dependencies
import { httpServer } from '@config/server.config'
import { appDataSource } from '@config/datasource.config'

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, async () => {
    console.log(`🚀 Server listening on port ${PORT}`)
    console.log(`======= ENV: ${process.env.NODE_ENV} =======`)

    try {
        //make database connection
        await appDataSource.initialize()
        console.log('Data Source has been initialized!')
    } catch (err) {
        console.error('Error during Data Source initialization: ', err)
    }
})
