const Marketplace = artifacts.require('./Marketplace.sol')

require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('Marketplace', ([deployer, seller, buyer]) => {
	let marketplace

	before(async () => {
		marketplace = await Marketplace.deployed()
	})

	describe('deployment', async () => {
		it('deploys successfully', async () => {
			const address = await marketplace.address
			assert.notEqual(address, 0x0)
			assert.notEqual(address, '')
			assert.notEqual(address, null)
			assert.notEqual(address, undefined)
		})

		it('has a name', async () => {
			const name = await marketplace.name()
			assert.equal(name, 'Dapp University Marketplace')
		})
	})


	describe('products', async () => {
		let result, productCount

		before(async () => {
			result = await marketplace.createProduct('iPhone X', web3.utils.toWei('1', 'Ether'), { from: seller })
			productCount = await marketplace.productCount()
		})

		it('creates products', async () => {
			// SUCCESS
			assert.equal(productCount, 1)
			const event = result.logs[0].args
			assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
			assert.equal(event.name, 'iPhone X', 'name is correct')
			assert.equal(event.price, '1000000000000000000', 'price is correct')
			assert.equal(event.owner, seller,'owner is correct')
			assert.equal(event.purchased, false, 'purchsed is correct')

			// FAILURES
			await await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;
			await await marketplace.createProduct('iPhone X', 0, { from: seller }).should.be.rejected;


		})


		it('list products', async () => {
			const product = await marketplace.products(productCount)
			assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
			assert.equal(product.name, 'iPhone X', 'name is correct')
			assert.equal(product.price, '1000000000000000000', 'price is correct')
			assert.equal(product.owner, seller,'owner is correct')
			assert.equal(product.purchased, false, 'purchsed is correct')


		})

		it('sell products', async () => {
			// Track the seller balance before purchase
			let oldSellerBalance
			oldSellerBalance = await web3.eth.getBalance(seller)
			oldSellerBalance = new web3.utils.BN(oldSellerBalance)

			// SUCCESS: Buyer makes purchase
			result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether')})

			// Check logs
			const event = result.logs[0].args
			assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
			assert.equal(event.name, 'iPhone X', 'name is correct')
			assert.equal(event.price, '1000000000000000000', 'price is correct')
			assert.equal(event.owner, buyer,'owner is correct')
			assert.equal(event.purchased, true, 'purchsed is correct')

			// Check if seller received funds
			let newSellerBalance
			newSellerBalance = await web3.eth.getBalance(seller)
			newSellerBalance = new web3.utils.BN(newSellerBalance)

			let price
			price = web3.utils.toWei('1', 'Ether')
			price = new web3.utils.BN(price)

			const expectedBalance = oldSellerBalance.add(price)

			assert.equal(newSellerBalance.toString(), expectedBalance.toString())

			// Failure: Tries to buy a product that does not exist, i.e. product must have valid id
			await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
			// Failure: Buyer tries to buy without enough ether
			await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
			//Failure: Deployer tries to buy product, i.e. product cant be purchased twice
			await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
			// Failure: Buyer tries to buy again, i.e. buyer cant be the seller
			await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;


		})
	})
})