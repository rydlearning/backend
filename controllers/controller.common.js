/**
 * Slantapp code and properties {www.slantapp.io}
 */
const sha1 = require('sha1');
const {Op, Sequelize} = require("sequelize")
const Joi = require('joi');

const stripe = require('stripe')(process.env.MODE === "dev" ? process.env.STRIPE_TSK : process.env.STRIPE_LSK);

const {useAsync, errorHandle, utils,} = require('./../core');
const EmailService = require("../services");
const {
    ModelPackage,
    ModelParent,
    ModelChild,
    ModelProgram,
    ModelCoupon,
    ModelTeacher,
    ModelCohort,
    ModelPartner,
    ModelPartnerProgram,
    ModelPartnerParent,
    ModelTimeGroup,
    ModelPartnerChild,
    ModelPromoChild,
    ModelPromoProgram,
    ModelMigration
} = require("../models");
const ModelTestimonial = require('../models/model.testimonial');
const {diasporaCountries} = require("../core/core.utils");

//Send otp
exports.commonSendOTP = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email({minDomainSegments: 2}).required()
        })
        const data = await schema.validateAsync(req.body)
        //send otp and return otp data
        const otp = utils.AsciiCodes(3)
        EmailService.sendOTP(data.email, otp + "1")
        res.json(utils.JParser("Kindly check your mail box for OTP", !!data, {
            otp: otp,
            email: data.email
        }));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get all packages
exports.commonGetPackages = useAsync(async (req, res, next) => {
    try {
        const data = await ModelPackage.findAll({
            order: [['id', 'desc']],
            where: {status: true},
            include: {model: ModelTimeGroup, as: "timeGroup"}
        })
        res.json(utils.JParser("Packages loaded", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get all times
exports.commonGetDayTimes = useAsync(async (req, res, next) => {
    try {
        const data = require("./../models/model.days.js")
        res.json(utils.JParser("Days loaded", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


//check coupon
exports.commonCheckCoupon = useAsync(async (req, res, next) => {
    try {
        const code = req.params.code
        const coupon = await ModelCoupon.findOne({where: {code, isActive: true}})
        res.json(utils.JParser("Coupon loaded", !!coupon, {isValid: !!coupon, code}));
    } catch (e) {
        //console.log(e)
        throw new errorHandle(e.message, 202);
    }
});

//get payment status from paystack
exports.commonPaymentStatusPaystack = useAsync(async (req, res, next) => {
    try {
        const isHook = req.body?.data?.id || false
        let output = {paid: false, msg: null, status: null}
        let pi_Id = req.query.trxref || req.body.data.reference;
        if (pi_Id) {
            //fetch and verify
            const headers = {'Authorization': `Bearer ${(process.env.MODE === "dev") ? process.env.PS_TSK : process.env.PS_LSK}`};
            const data = await fetch("https://api.paystack.co/transaction/verify/" + pi_Id, {headers}).then(r => r.json())
            //console.log(data)
            //check payment
            const liveMode = data?.data?.domain === "live"
            const trxId = data?.data?.reference + "." + data?.data?.id
            const status = data?.status && data?.data?.status === "success"
            const metadata = data?.data?.metadata
            const amount_total = (data?.data?.amount / 100)
            //process payment
            if (liveMode && status) {
                //update programs
                if (!metadata.isPartner) {
                    const programIDs = metadata.programIDs.split(",")
                    if (programIDs.length > 0) {
                        const [numRow] = await ModelProgram.update({
                            isPaid: true,
                            trxId: trxId
                        }, {where: {id: programIDs}})
                        if (numRow > 0) {
                            output.status = "Payment Successful"
                            output.paid = true
                            output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
                            //send an email from hook only...
                            if (req.method.toLowerCase() === "post") {
                                const parent = await ModelParent.findByPk(Number(metadata.parentID))
                                if (parent) {
                                    await parent.update({balance: 0})
                                    EmailService.sendSubscriptionPaymentEmail(parent.email, parent)
                                }
                            }
                        }
                    }
                } else {
                    //update programs from partners
                    const partnerId = parseInt(metadata.partner_id)
                    const cohortId = parseInt(metadata.cohortId)
                    //for parents of partners
                    const partnerProgramIds = metadata.programIDs
                    const partnerParentId = metadata.parentID

                    if (partnerId && cohortId) {
                        const [numRow] = await ModelPartnerProgram.update({
                            isPaid: true,
                            trxId: trxId
                        }, {where: {partnerId, cohortId}})
                        if (numRow > 0) {
                            output.status = "Payment Successful"
                            output.paid = true
                            output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
                            //send an email from hook only...
                            if (req.method.toLowerCase() === "post") {
                                const partner = await ModelPartner.findByPk(Number(partnerId))
                                if (partner) {
                                    EmailService.sendSubscriptionPaymentEmail(partner.email, partner)
                                }
                            }
                        }
                    } else if (partnerParentId && partnerProgramIds && !partnerId) {
                        //check for and pay for parent
                        const programIDs = metadata.programIDs.split(",")
                        if (programIDs.length > 0) {
                            const [numRow] = await ModelPartnerProgram.update({
                                isPaid: true,
                                trxId: trxId
                            }, {where: {id: programIDs}})
                            if (numRow > 0) {
                                output.status = "Payment Successful"
                                output.paid = true
                                output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
                                //send an email from hook only...
                                if (req.method.toLowerCase() === "post") {
                                    const parent = await ModelPartnerParent.findByPk(Number(metadata.parentID))
                                    if (parent) {
                                        EmailService.sendSubscriptionPaymentEmail(parent.email, parent)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                output.status = "Payment Failed"
                output.paid = false
            }
        }
        //pause views render
        if (isHook) {
            res.json({
                status: true,
                data: [],
                message: "Payment status ack."
            });
        } else {
            //req passed
            req.app.locals.output = output
            next()
        }
    } catch (e) {
        res.render("error", {msg: e.message})
        //throw new errorHandle(e.message, 202);
        console.log(e)
    }
});

//get payment hook stripe
exports.commonPaymentStatus = useAsync(async (req, res, next) => {
    try {
        const isHook = req.body?.data?.object?.id || false
        let output = {paid: false, msg: null, status: null}
        let pi_Id = req.query.id || req.body.data.object.id;
        console.log(pi_Id)
        if (pi_Id) {
            const data = await stripe.checkout.sessions.retrieve(pi_Id);
            console.log(data)
            //check payment
            const liveMode = data.livemode
            const trxId = data.id
            const status = data.status === "complete" && data.payment_status === "paid"
            const metadata = data.metadata
            const amount_total = (data.amount / 100)
            //process payment
            if (liveMode && status) {
                if (!metadata.isPartner) {
                    //update programs from parents
                    const programIDs = metadata.programIDs.split(",")
                    if (programIDs.length > 0) {
                        const [numRow] = await ModelProgram.update({
                            isPaid: true,
                            trxId: data.id
                        }, {where: {id: programIDs}})
                        if (numRow > 0) {
                            output.status = "Payment Successful"
                            output.paid = true
                            output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
                            //send an email from hook only...
                            if (req.method.toLowerCase() === "post") {
                                const parent = await ModelParent.findByPk(Number(metadata.parentID))
                                if (parent) {
                                    await parent.update({balance: 0})
                                    EmailService.sendSubscriptionPaymentEmail(parent.email, parent)
                                }
                            }
                        }
                    }
                } else {
                    //update programs from partners
                    const partnerId = parseInt(metadata.partner_id)
                    const cohortId = parseInt(metadata.cohortId)
                    //for parents of partners
                    const partnerProgramIds = metadata.programIDs
                    const partnerParentId = metadata.parentID

                    if (partnerId > 0 && cohortId > 0) {
                        const [numRow] = await ModelPartnerProgram.update({
                            isPaid: true,
                            trxId: data.id
                        }, {where: {partnerId, cohortId}})
                        if (numRow > 0) {
                            output.status = "Payment Successful"
                            output.paid = true
                            output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
                            //send an email from hook only...
                            if (req.method.toLowerCase() === "post") {
                                const partner = await ModelPartner.findByPk(Number(partnerId))
                                if (partner) {
                                    EmailService.sendSubscriptionPaymentEmail(partner.email, partner)
                                }
                            }
                        }
                    } else if (partnerParentId && partnerProgramIds && !partnerId) {
                        //check for and pay for parent
                        const programIDs = metadata.programIDs.split(",")
                        if (programIDs.length > 0) {
                            const [numRow] = await ModelPartnerProgram.update({
                                isPaid: true,
                                trxId: data.id
                            }, {where: {id: programIDs}})
                            if (numRow > 0) {
                                output.status = "Payment Successful"
                                output.paid = true
                                output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
                                //send an email from hook only...
                                if (req.method.toLowerCase() === "post") {
                                    const parent = await ModelPartnerParent.findByPk(Number(metadata.parentID))
                                    if (parent) {
                                        EmailService.sendSubscriptionPaymentEmail(parent.email, parent)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                output.status = "Payment Failed"
                output.paid = false
            }
        }
        //pause views render
        if (isHook) {
            res.json({
                status: true,
                data: [],
                message: "Payment status ack."
            });
        } else {
            //req passed
            req.app.locals.output = output
            next()
        }
    } catch (e) {
        res.render("error", {msg: e.message})
        //throw new errorHandle(e.message, 202);
    }
});

// exports.commonPaymentStatus = useAsync(async (req, res, next) => {
//     try {
//         const isHook = req.body?.data?.object?.id || false
//         let output = { paid: false, msg: null, status: null }
//         let pi_Id = req.query.id || req.body.data.object.id;
//         console.log(pi_Id)
//         if (pi_Id) {
//             const data = await stripe.checkout.sessions.retrieve(pi_Id);
//             console.log(data)
//             //check payment
//             const liveMode = data.livemode
//             const trxId = data.id
//             const status = data.status === "complete" && data.payment_status === "paid"
//             const metadata = data.metadata
//             const amount_total = (data.amount / 100)
//             //process payment
//             if (liveMode && status) {
//                 //update programs
//                 const programIDs = metadata.programIDs.split(",")
//                 if (programIDs.length > 0) {
//                     const [numRow] = await ModelProgram.update({
//                         isPaid: true,
//                         trxId: data.id
//                     }, { where: { id: programIDs } })
//                     if (numRow > 0) {
//                         output.status = "Payment Successful"
//                         output.paid = true
//                         output.info = "Congratulations! Your payment has been successfully received. Thank you for your interest in our programs. We're excited to embark on this journey with you and help you achieve your goals. Stay tuned for further instructions and resources to maximize your experience. Let's make great strides together!"
//                         //send an email from hook only...
//                         if (req.method.toLowerCase() === "post") {
//                             const parent = await ModelParent.findByPk(Number(metadata.parentID))
//                             if (parent) {
//                                 EmailService.sendSubscriptionPaymentEmail(parent.email, parent)
//                             }
//                         }
//                     }
//                 }
//             } else {
//                 output.status = "Payment Failed"
//                 output.paid = false
//             }
//         }
//         //pause views render
//         if (isHook) {
//             res.json({
//                 status: true,
//                 data: [],
//                 message: "Payment status ack."
//             });
//         } else {
//             //req passed
//             req.app.locals.output = output
//             next()
//         }
//     } catch (e) {
//         res.render("error", { msg: e.message })
//         //throw new errorHandle(e.message, 202);
//     }
// });

//get payment intent
exports.commonGetPaymentIntent = useAsync(async (req, res, next) => {
    const {currency, amount, metadata, email, phone, name} = req.body;
    try {
        // const customer = await stripe.customers.create({
        //     name: name,
        //     email: email,
        //     phone: phone
        // });
        // Create a PaymentIntent with the order amount and currency
        // const paymentIntent = await stripe.paymentIntents.create({
        //     amount: amount,
        //     currency: currency,
        //     // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        //     automatic_payment_methods: {
        //         enabled: true,
        //     },
        //     metadata: metadata,
        //     receipt_email: email,
        //     customer: customer.id
        // });
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: 'RYD Subscription',
                            images: [
                                'https://api-pro.rydlearning.com/receipt_logo.svg'
                            ]
                        },
                        unit_amount: amount
                    },
                    quantity: 1
                }
            ],
            metadata: {
                ...metadata
            },
            mode: 'payment',
            success_url: `https://api-pro.rydlearning.com/common/payment-status?id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://api-pro.rydlearning.com/common/payment-status`
        });
        // console.log(session)
        // res.json({
        //     status: !!paymentIntent.client_secret,
        //     data: {clientSecret: paymentIntent.client_secret},
        //     message: "Intent Loaded"
        // });
        //console.log(session)
        res.json({
            status: !!session,
            data: session,
            message: "Intent Loaded"
        });
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500)
    }

});

exports.commonGetPartnerPaymentIntent = useAsync(async (req, res, next) => {
    const {currency, amount, metadata} = req.body;
    try {
        // const customer = await stripe.customers.create({
        //     name: name,
        //     email: email,
        //     phone: phone
        // });
        // Create a PaymentIntent with the order amount and currency
        // const paymentIntent = await stripe.paymentIntents.create({
        //     amount: amount,
        //     currency: currency,
        //     // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        //     automatic_payment_methods: {
        //         enabled: true,
        //     },
        //     metadata: metadata,
        //     receipt_email: email,
        //     customer: customer.id
        // });
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: 'RYD Partners Payment',
                            images: [
                                'https://api-pro.rydlearning.com/receipt_logo.svg'
                            ]
                        },
                        unit_amount: amount
                    },
                    quantity: 1
                }
            ],
            metadata: {
                ...metadata
            },
            mode: 'payment',
            success_url: `https://api-pro.rydlearning.com/common/payment-status?id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://api-pro.rydlearning.com/common/payment-status`
        });
        // console.log(session)
        // res.json({
        //     status: !!paymentIntent.client_secret,
        //     data: {clientSecret: paymentIntent.client_secret},
        //     message: "Intent Loaded"
        // });
        //console.log(session)
        res.json({
            status: !!session,
            data: session,
            message: "Intent Loaded"
        });
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500)
    }

});

//get parent carts
exports.commonProcessInvoice = useAsync(async (req, res, next) => {
    //allow this country to use altPrice without conversion
    const _weekDayArr = utils.weekDayArr
    const _exmCountries = ["Nigeria"]
    const _notSupportCountries = ["Ghana"]
    let message = ""
    try {
        const data = await ModelParent.findByPk(req.params.id, {
            include: {
                model: ModelChild, as: "children",
                required: true,
                include: {
                    model: ModelProgram, as: "programs", where: {isPaid: false},
                    required: true,
                    include: {
                        model: ModelPackage, as: "package",
                        required: true
                    },
                }
            }
        })
        //if nothing found, go to empty screen
        if (!data) {
            //send out
            res.render("empty")
            return
        }
        if (_notSupportCountries.includes(data.country)) {
            data.country = "United States";
        }
        //first check if it's a diaspora
        let isDiaspora = diasporaCountries.includes(data.country)
        //final check.. using NGN rate
        const curDia = await utils.getCurrencyRateDiaspora("Nigeria", data?.country)
        //check rate use
        const useGlobalRate = (!_exmCountries.includes(data?.country)) && !isDiaspora
        const cur = useGlobalRate ? await utils.getCurrencyRate(data?.country) : await utils.getCurrencyRate(data?.country, true)

        //if country is exempted from conversion
        function useRateIfNotExempted(x) {
            if (useGlobalRate) return Number(x.package?.amount * (cur.rate)).toFixed(0)
            else return Number(x.package?.altAmount * 1).toFixed(0)
        }

        //if country is exempted from conversion
        function useNoRateIfNotExempted(x) {
            if (useGlobalRate) return Number(x.package?.amount).toFixed(0)
            else return Number(x.package?.altAmount).toFixed(0)
        }

        //if country is exempted from conversion use value rate
        function useValueRateIfNotExempted(x) {
            if (useGlobalRate) return Number(x * (cur.rate)).toFixed(0)
            else return Number(x * 1).toFixed(0)
        }

        if (data) {
            let d = data.toJSON()
            let dd = data.toJSON()
            //coupon info
            let isCoupon = false
            let couponMsg = ""
            let couponData = null
            const paymentID = "RYD" + utils.AsciiCodes(5) + utils.AsciiCodesALP(3)
            //sort it and send
            const _children = d.children
            const _program = d.children.map(x => x.programs[0])
            const _program2 = dd.children.map(x => x.programs[0])

            //no conversion price
            let _packagesNoRate = _program2.map(function (x) {
                x.package.amount = useNoRateIfNotExempted(x)
                return x.package;
            })
            //amount with rate
            let _packages = _program.map(function (x) {
                x.package.amount = useRateIfNotExempted(x)
                return x.package;
            })

            let _amount = Number(_packages.reduce((x, y) => Number(x) + Number(y.amount), 0)).toFixed(0)
            let _amountNoRate = Number(_packagesNoRate.reduce((x, y) => Number(x) + Number(y.amount), 0)).toFixed(0)
            //console.log(_amountNoRate)
            let _amountBefore = _amount
            let _useCoupon = null;
            //if there is coupon, apply
            if (req.params.coupon) {
                const cc = await ModelCoupon.findOne({where: {code: req.params.coupon.toUpperCase(), isActive: true}})
                if (cc) {
                    //check if coupon is eligible
                    const countriesArray = cc.byCountry.split(",")
                    if (cc && (countriesArray?.find(f => f.trim() === d.country.trim()) || countriesArray[0].toLowerCase() === "all")) {

                        //recalculate
                        let offCost = 0;
                        let inCost = 0;
                        //no conversion price
                        _program2.map(function (x) {
                            const pL = x?.package?.level
                            if ((cc?.byLevel === 0 && !cc?.mLevel) || cc?.byLevel === pL || (cc?.mLevel && cc?.mLevel?.includes(pL)) || (cc?.mLevel && cc?.mLevel[0] === 0 && cc?.byLevel === 0)) {
                                inCost += Number(x?.package?.amount);
                            } else {
                                offCost += Number(x?.package?.amount);
                            }
                            x.package.amount = useNoRateIfNotExempted(x)
                            return x.package;
                        })

                        _amountNoRate = inCost

                        const couponCompute = utils.useCoupon(_amountNoRate, cc)
                        _amount = useValueRateIfNotExempted(Number(couponCompute.v + offCost))
                        _useCoupon = couponCompute
                        //tell admin who uses the coupon
                        const pIDS = Array.prototype.map.call(_program, (it) => it.id)
                        //update programs by coupon iDs
                        await ModelProgram.update({couponId: cc.id}, {where: {id: pIDS}})
                        //console.log(pIDS)
                    } else {
                        //You are not eligible for this coupon
                        message = "You are not eligible for this coupon: " + req.params.coupon
                    }
                }
            }
            //iterate program ids
            const programIDs = Array.prototype.map.call(_program, function (item) {
                return item.id;
            }).join(",")
            //find coupon for me
            let _foundCoupon = null
            const suggestCoupon = await ModelCoupon.findAll({where: {isActive: true}})
            if (suggestCoupon.length > 0) {
                _foundCoupon = suggestCoupon.find((r => {
                    return Array.from(r.toJSON().byCountry).includes(d.country) || Array.from(r.toJSON().byCountry).includes("All")
                }))
            }
            if (isDiaspora) {
                //final check.. using NGN rate
                _amount = Number(_amount / curDia.rate).toFixed(0)
                _amountBefore = Number(_amountBefore / curDia.rate).toFixed(0)
                _useCoupon.d = Number(_useCoupon.d / curDia.rate).toFixed(0)
            }
            //junk data out
            req.app.locals.invoice = {
                message,
                d,
                curDia,
                _children,
                _program,
                _packages,
                _amount: Math.max(0, (_amount - data?.balance)),
                isCoupon,
                couponData,
                couponMsg,
                paymentID,
                cur,
                _useCoupon,
                _amountBefore,
                programIDs,
                _weekDayArr,
                stripeKey: process.env.MODE === "dev" ? process.env.STRIPE_TPK : process.env.STRIPE_LPK,
                paystackKey: process.env.MODE === "dev" ? process.env.PS_TPK : process.env.PS_LPK,
                _foundCoupon
            };
            next()
        } else {
            res.render("error")
        }
    } catch (e) {
        console.log(e)
        res.render("error")
        //throw new errorHandle(e.message, 202);
    }
});

//get partner parent carts
exports.commonPartnerProcessInvoice = useAsync(async (req, res, next) => {
    //allow this country to use altPrice without conversion
    const _weekDayArr = utils.weekDayArr
    const _exmCountries = ["Nigeria"]
    let message = ""
    try {
        let data = await ModelPartnerParent.findByPk(req.params.id, {
            include: {
                model: ModelPartnerChild, as: "children",
                required: true,
                include: {
                    model: ModelPartnerProgram, as: "programs", where: {isPaid: false, partnerId: null},
                    required: true,
                    include: {
                        model: ModelPackage, as: "partner_package",
                        required: true
                    },
                }
            }
        })
        // if(data){
        //     // Modify the alias in the result
        //     if (data && data.children) {
        //         data = data.children.forEach(child => {
        //             child.programs.forEach(program => {
        //                 // Rename "partner_package" to "package"
        //                 program.package = program.partner_package;
        //                 delete program.partner_package;
        //             });
        //         });
        //     }
        // }
        //if nothing found, go to empty screen
        if (!data) {
            //send out
            res.render("empty")
            return
        }
        //check rate use
        const useGlobalRate = (!_exmCountries.includes(data?.country))
        const cur = useGlobalRate ? await utils.getCurrencyRate(data?.country) : await utils.getCurrencyRate(data?.country, true)

        //if country is exempted from conversion
        function useRateIfNotExempted(x) {
            if (useGlobalRate) return Number(x.partner_package?.amount * (cur.rate)).toFixed(0)
            else return Number(x.partner_package?.altAmount * 1).toFixed(0)
        }

        //if country is exempted from conversion
        function useNoRateIfNotExempted(x) {
            if (useGlobalRate) return Number(x.partner_package?.amount).toFixed(0)
            else return Number(x.partner_package?.altAmount).toFixed(0)
        }

        //if country is exempted from conversion use value rate
        function useValueRateIfNotExempted(x) {
            if (useGlobalRate) return Number(x * (cur.rate)).toFixed(0)
            else return Number(x * 1).toFixed(0)
        }

        if (data) {
            let d = data.toJSON()
            let dd = data.toJSON()
            //coupon info
            let isCoupon = false
            let couponMsg = ""
            let couponData = null
            const paymentID = "RYD" + utils.AsciiCodes(5) + utils.AsciiCodesALP(3)
            //sort it and send
            const _children = d.children
            const _program = d.children.map(x => x.programs[0])
            const _program2 = dd.children.map(x => x.programs[0])

            //no conversion price
            const _packagesNoRate = _program2.map(function (x) {
                x.partner_package.amount = useNoRateIfNotExempted(x)
                return x.partner_package;
            })
            //amount with rate
            const _packages = _program.map(function (x) {
                x.partner_package.amount = useRateIfNotExempted(x)
                return x.partner_package;
            })

            let _amount = Number(_packages.reduce((x, y) => Number(x) + Number(y.amount), 0)).toFixed(0)
            let _amountNoRate = Number(_packagesNoRate.reduce((x, y) => Number(x) + Number(y.amount), 0)).toFixed(0)
            //console.log(_amountNoRate)
            let _amountBefore = _amount
            let _useCoupon = null;
            //if there is coupon, apply
            if (req.params.coupon) {
                const cc = await ModelCoupon.findOne({where: {code: req.params.coupon.toUpperCase(), isActive: true}})
                if (cc) {
                    //check if coupon is eligible
                    const countriesArray = cc.byCountry.split(",")
                    if (cc && (countriesArray.includes(d.country) || countriesArray[0].toLowerCase() === "all")) {
                        const couponCompute = utils.useCoupon(_amountNoRate, cc)
                        _amount = useValueRateIfNotExempted(couponCompute.v)
                        _useCoupon = couponCompute
                        //tell admin who uses the coupon
                        const pIDS = Array.prototype.map.call(_program, (it) => it.id)
                        //update programs by coupon iDs
                        await ModelPartnerProgram.update({couponId: cc.id}, {where: {id: pIDS}})
                        //console.log(pIDS)
                    } else {
                        //You are not eligible for this coupon
                        message = "You are not eligible for this coupon: " + req.params.coupon
                    }
                }
            }
            //iterate program ids
            const programIDs = Array.prototype.map.call(_program, function (item) {
                return item.id;
            }).join(",")
            //find coupon for me
            let _foundCoupon = null
            const suggestCoupon = await ModelCoupon.findAll({where: {isActive: true}})
            if (suggestCoupon.length > 0) {
                _foundCoupon = suggestCoupon.find((r => {
                    return Array.from(r.toJSON().byCountry).includes(d.country) || Array.from(r.toJSON().byCountry).includes("All")
                }))
            }
            //junk data out
            req.app.locals.invoice = {
                message,
                d,
                _children,
                _program,
                _packages,
                _amount,
                isCoupon,
                couponData,
                couponMsg,
                paymentID,
                cur,
                _useCoupon,
                _amountBefore,
                programIDs,
                _weekDayArr,
                stripeKey: process.env.MODE === "dev" ? process.env.STRIPE_TPK : process.env.STRIPE_LPK,
                paystackKey: process.env.MODE === "dev" ? process.env.PS_TPK : process.env.PS_LPK,
                _foundCoupon
            };
            next()
        } else {
            res.render("error")
        }
    } catch (e) {
        console.log(e)
        res.render("error")
        //throw new errorHandle(e.message, 202);
    }
});

//connect db
const dbConn = new Sequelize("rydlearn00", "rydlearn00", "KX8fBWMfC2xMZHFG", {
    host: "37.60.249.44",
    port: 3306,
    dialect: "mysql",
    logging: (e) => {
        console.log(e);
    }
});

//Stripe Pay Controller
exports.stripePaymentCheck = useAsync(async (req, res, next) => {
    const data = await stripe.checkout.sessions.retrieve(req.params.id);
    try {
        res.send(`
Amount: ${data.currency.toUpperCase()}${data.amount_total / 100}<br/>
Status: ${data.payment_status}<br/>
`)
    } catch (e) {
        res.send("Nat a valid payment id")
    }
})

//Migrations Controller
exports.migrationDBs = useAsync(async (req, res, next) => {
    // try {
    //     let parents = []
    //     //start implementations
    //     const [d] = await dbConn.query("select * from ryd00_parents")
    //     if (d.length > 0) {
    //         //do bulk insert
    //         for(let o of d){
    //            let p = {}
    //             //modifies
    //             p.firstName = o.fullName.split(" ")[0]
    //             p.lastName = o.fullName.split(" ")[1]
    //             p.email = o.email
    //             p.password = o.password
    //             p.phone = o.phone
    //             p.country = o.country
    //             p.state = o.city
    //             p.type = 1
    //             p.status = o.status
    //             p.createdAt = o.createdAt
    //             p.updateAt = o.updateAt
    //             p.timezone = o.timeZone
    //             p.timeOffset = await utils.getTimeOffsetByZone(o.timeZone)
    //             //push
    //             parents.push(p)
    //         }
    //     }
    //     //do bulk insert
    //     const bIns = await ModelParent.bulkCreate(parents)
    //     res.json("Inserted "+bIns.length)
    // } catch (e) {
    //     throw new errorHandle(e.message, 202);
    // }
    // try {
    //     let child = []
    //     //start implementations
    //     const [d] = await dbConn.query("select * from ryd00_child")
    //     if (d.length > 0) {
    //         //do bulk insert
    //         for(let o of d){
    //             let c = {}
    //             //modifies
    //             c.parentId = o.parentId
    //             c.firstName = o.fullName.split(" ")[0]
    //             c.lastName = o.fullName.split(" ")[1] ||  o.fullName.split(" ")[0]
    //             c.age = o.age
    //             c.gender = o.gender
    //             c.status = 1
    //             c.createdAt = o.createdAt
    //             c.updateAt = o.updateAt
    //             c.deletedAt = o.deletedAt
    //             //push
    //             child.push(c)
    //         }
    //     }
    //     //do bulk insert
    //     const bIns = await ModelChild.bulkCreate(child)
    //     res.json("Inserted "+bIns.length)
    // } catch (e) {
    //     throw new errorHandle(e.message, 202);
    // }
    // try {
    //     let programs = []
    //     //start implementations
    //     const [d] = await dbConn.query("select * from ryd00_levels where status=1")
    //     if (d.length > 0) {
    //         //do bulk insert
    //         for (let o of d) {
    //             let p = {}
    //             //modifies
    //             p.childId = o.childId
    //             p.packageId = o.program === 0 ? 1 : 2
    //             p.isPaid = o.status
    //             p.trxId = o.trxId
    //             p.level = o.level
    //             p.time = o.time
    //             p.day = o.day
    //             p.timeOffset = o.timeOffSet
    //             p.nextClassDate = o.commenceDate
    //             p.endClassDate = o.endDate
    //             p.createdAt = o.createdAt
    //             p.updateAt = o.updateAt
    //             p.deletedAt = o.deletedAt
    //             //push
    //             programs.push(p)
    //         }
    //     }
    //     //do bulk insert
    //     const bIns = await ModelProgram.bulkCreate(programs)
    //     res.json("Inserted " + bIns.length)
    // } catch (e) {
    //     throw new errorHandle(e.message, 202);
    // }
    // try {
    //     let programs = []
    //     //start implementations
    //     const [d] = await dbConn.query("select ux.id, ux.classLink from ryd00_levels lv inner join ryd00_child ux on lv.childId=ux.id where lv.status=1")
    //     if (d.length > 0) {
    //         //do bulk insert
    //         for (let o of d) {
    //             //find teacher and update class
    //             const prog = await ModelProgram.findOne({where: {childId: o.id}})
    //             const teacher = await ModelTeacher.findOne({where: {classLink: o.classLink}})
    //             //update
    //             if(teacher){
    //                 await prog.update({teacherId: teacher.id})
    //             }
    //         }
    //     }
    //     //do bulk insert
    //     // const bIns = await ModelProgram.bulkCreate(programs)
    //     // res.json("Inserted " + bIns.length)
    //     res.json(d)
    // } catch (e) {
    //     throw new errorHandle(e.message, 202);
    // }
});


// AFFILIATES
exports.getAffiliates = useAsync(async (req, res, next) => {
    try {
        const {code, accessKey} = req.params

        const affiliates = await ModelCoupon.findOne(
            {
                where: {code, accessKey},
                include: [
                    {
                        model: ModelProgram,
                        as: "programs",
                        required: true,
                        include: [
                            {
                                model: ModelCohort,
                                as: "cohort",
                                required: true
                            },
                            {
                                model: ModelChild,
                                as: "child",
                                required: true,
                                include: [
                                    {
                                        model: ModelParent,
                                        as: "parent",
                                        required: true
                                    },
                                ]
                            },
                            {
                                model: ModelPackage,
                                as: "package",
                                required: true
                            },
                        ]
                    }
                ]
            }
        );
        res.json(utils.JParser("Affiliates retrieved successfully", !!affiliates, affiliates));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetAllTestimonial = useAsync(async (req, res, next) => {
    try {
        const options = {
            where: {status: true},
            include: [
                {
                    model: ModelParent,
                    as: "parent",
                    required: false
                },
            ]
        }

        const testimonial = await ModelTestimonial.findAll(options)
        res.json(utils.JParser("Testimonial retrieved successfully", !!testimonial, testimonial));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetPrograms = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const options = {
            where: {id},
            include: [
                {
                    model: ModelProgram,
                    as: "programs",
                    required: false,
                    include: [
                        {
                            model: ModelPackage,
                            as: "package",
                            required: true
                        },
                    ]
                },
            ]
        }

        const childDetails = await ModelChild.findOne(options)

        res.json(utils.JParser("Programs retrieved successfully", !!childDetails, childDetails));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetProgramCertificate = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const options = {
            where: {id},
            include: [
                {
                    model: ModelPromoChild,
                    as: "child",
                    required: false,
                },
            ]
        }

        const childDetails = await ModelPromoProgram.findOne(options)

        res.json(utils.JParser("Programs retrieved successfully", !!childDetails, childDetails));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.CheckProgramCohorts = useAsync(async (req, res, next) => {
    try {
        const options = {
            where: {cohortId: 4, isPaid: 1}
        }
        const body = {
            isCompleted: 0
        }

        const program = await ModelProgram.findAll(options)
        // await program.update(body)
        res.json(utils.JParser("Testimonial retrieved successfully", !!program, program));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.CheckMigrations = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const options = {
            where: {promoId: id}
        }

        const migration = await ModelMigration.findOne(options)
        // await program.update(body)
        res.json(utils.JParser("Migration retrieved successfully", !!migration, migration));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});
