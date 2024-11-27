function getNumInverters(panelCount, inverter) {
    let numInverters = 0
    if (inverter.type == "micro") {
        numInverters = Math.ceil(panelCount / inverter.numMods)
    }
    if (inverter.type == "string") {
        numInverters = window.getProject().getProjectData().num_string_inverters //unitil we build out more
    }
    return numInverters
}

function getNumBranches(panelCount, inverter) {
    let numBranches
    if (inverter.type == "micro") {
        numBranches = Math.ceil(
            panelCount / (inverter.maxUnits * inverter.numMods)
        )
    }
    return numBranches
}

function getInterconnections(data) {
    let {
        panelCount,
        inverterModel,
        serviceStyle,
        mainBreakerRating,
        mainBusRating,
        feedthroughMainRating,
        feedthroughBusRating,
        breakerSpaceMDP,
        breakerSpaceFeedthrough,
        newMainBreakerRating,
        feedthroughConvertible,
    } = data
    if (!feedthroughBusRating && feedthroughMainRating) {
        feedthroughMainRating = null
    }
    if (feedthroughMainRating && !feedthroughConvertible) {
        feedthroughMainRating = null
    }
    let interconnections = allInterconnections
    let preferredInterconnection = false
    let subBreakerRating
    let subBusRating
    let inverter = Inverters.find((inverter) => inverter.label == inverterModel)
    let numInverters = getNumInverters(panelCount, inverter)
    let continuousAmps = numInverters * inverter.maxACCurrent
    let calcAmps = continuousAmps * 1.25

    let derateOptions
    if (inverterModel && serviceStyle) {
        console.log("Interconnection Data is: ", data)

        interconnections = []
        //assume bus size == breaker size if not given
        if (feedthroughMainRating && !feedthroughBusRating) {
            feedthroughBusRating = feedthroughMainRating
        }
        //assume bus size == breaker size if not given
        if (!mainBusRating && mainBreakerRating) {
            mainBusRating = mainBreakerRating
        }
        if (serviceStyle == "Separate MDP") {
            //possible interconnections: "SUPPLYSIDE", "BACKFEEDBREAKER", "SUPPLYSIDE"
            // if (!mainBreakerRating && !newMainBreakerRating) {
            //   //interconnections.push("SUPPLYSIDENEWMDISCNOMAIN");
            // } else
            if (mainBreakerRating || newMainBreakerRating) {
                if (!mainBreakerRating) {
                    interconnections.push("SUPPLYSIDENEWMDISCNOMAIN")
                }
                interconnections.push(
                    "SUPPLYSIDE",
                    "SUPPLYSIDETROUGH",
                    "SUPPLYSIDENEWMDISC"
                )
                if (breakerSpaceMDP) {
                    if (
                        oneTwentyPercentRule(calcAmps, mainBusRating, mainBreakerRating)
                    ) {
                        interconnections.push("BACKFEEDBREAKER")
                    } else if (
                        getDerateOptions(
                            panelCount,
                            inverterModel,
                            mainBusRating,
                            mainBreakerRating
                        ).length
                    ) {
                        derateOptions = getDerateOptions(
                            panelCount,
                            inverterModel,
                            mainBusRating,
                            mainBreakerRating
                        )
                        if (newMainBreakerRating) {
                            interconnections.push("BACKFEEDBREAKERWDERATE")
                        }
                    }
                }
            }
        }
        if (serviceStyle == "Meter-Main Combo") {
            //possible interconnections: "BACKFEEDBREAKERMM", "BACKFEEDBREAKERMMMAIN", "LOADSIDETAP", "LOADSIDETAPMAIN"
            //if no feedthrough panel
            if (!mainBreakerRating) {
                interconnections.push("SUPPLYSIDEBREAKER")
            } else if (!feedthroughBusRating) {
                if (breakerSpaceMDP) {
                    if (
                        oneTwentyPercentRule(calcAmps, mainBusRating, mainBreakerRating)
                    ) {
                        interconnections.push("BACKFEEDBREAKERMMNOFT")
                    } else if (
                        getDerateOptions(
                            panelCount,
                            inverterModel,
                            mainBusRating,
                            mainBreakerRating
                        ).length
                    ) {
                        derateOptions = getDerateOptions(
                            panelCount,
                            inverterModel,
                            mainBusRating,
                            mainBreakerRating
                        )
                        if (newMainBreakerRating) {
                            interconnections.push("BACKFEEDBREAKERMMWDERATENOFT")
                        }
                    }
                }
            } else {
                //if has feedthrough
                //if using sumrule

                if (
                    !newMainBreakerRating &&
                    !oneTwentyPercentRule(calcAmps, mainBusRating, mainBreakerRating) &&
                    feedthroughConvertible
                ) {
                    interconnections.push("BACKFEEDBREAKERMMMAINSUM")
                    interconnections.push("LOADSIDETAPMAINSUM")
                }


                if (
                    !newMainBreakerRating &&
                    !oneTwentyPercentRule(calcAmps, mainBusRating, mainBreakerRating) &&
                    !feedthroughConvertible
                ) {
                    interconnections.push("BACKFEEDBREAKERMMMAINSUMNEWFT")
                    interconnections.push("LOADSIDETAPMAINNEWFTSUM")
                }


                //if no derate NECESSARY
                if (
                    !newMainBreakerRating &&
                    oneTwentyPercentRule(calcAmps, mainBusRating, mainBreakerRating) &&
                    feedthroughConvertible
                ) {
                    // if (breakerSpaceMDP) {
                    //   interconnections.push("BACKFEEDBREAKERMMMAIN");
                    // } else {
                    //   interconnections.push("LOADSIDETAPMAIN");
                    // }
                    interconnections.push("BACKFEEDBREAKERMMMAIN")
                    interconnections.push("LOADSIDETAPMAIN")

                    if (
                        oneTwentyPercentRule(
                            calcAmps,
                            Math.min(mainBusRating, feedthroughBusRating),
                            mainBreakerRating
                        )
                    ) {
                        if (breakerSpaceFeedthrough) {
                            interconnections.push("BACKFEEDBREAKERFEEDTHROUGH") //IN FEED THROUGH
                        }
                    }
                }
                //FOR NONCONVERTIBLE PANEL WITH BACKFEED IN FT
                if (
                    !newMainBreakerRating &&
                    oneTwentyPercentRule(calcAmps, mainBusRating, mainBreakerRating) &&
                    !feedthroughConvertible
                ) {
                    //push new enclosure option
                    interconnections.push("LOADSIDETAPMAINNEWFT")
                    interconnections.push("BACKFEEDBREAKERMMMAINNEWFT")
                    if (
                        oneTwentyPercentRule(
                            calcAmps,
                            Math.min(mainBusRating, feedthroughBusRating),
                            mainBreakerRating
                        )
                    ) {
                        if (breakerSpaceFeedthrough) {
                            interconnections.push("BACKFEEDBREAKERFEEDTHROUGH") //IN FEED THROUGH
                        }
                    }

                }
                //if derate
                if (
                    newMainBreakerRating &&
                    getDerateOptions(
                        panelCount,
                        inverterModel,
                        mainBusRating,
                        mainBreakerRating
                    ).length
                ) {
                    derateOptions = getDerateOptions(
                        panelCount,
                        inverterModel,
                        mainBusRating,
                        mainBreakerRating
                    )
                    console.log(mainBreakerRating, newMainBreakerRating, calcAmps)
                    if (
                        newMainBreakerRating &&
                        mainBreakerRating - newMainBreakerRating >= calcAmps
                    ) {
                        // if (breakerSpaceMDP) {
                        //   interconnections.push("BACKFEEDBREAKERMMWDERATE");
                        // } else {
                        //   interconnections.push("LOADSIDETAPWDERATE");
                        // }

                        interconnections.push("BACKFEEDBREAKERMMWDERATE")
                        interconnections.push("LOADSIDETAPWDERATE")
                    } else if (newMainBreakerRating) {
                        // if (breakerSpaceMDP) {
                        //   interconnections.push("BACKFEEDBREAKERMMMAINWDERATE");
                        // } else {
                        //   interconnections.push("LOADSIDETAPMAINWDERATE");
                        // }
                        if (feedthroughConvertible) {
                            interconnections.push("BACKFEEDBREAKERMMMAINWDERATE")
                            interconnections.push("LOADSIDETAPMAINWDERATE")
                        }

                        interconnections.push("BACKFEEDBREAKERWDERATEFEEDTHROUGH")
                    }
                    if (
                        newMainBreakerRating &&
                        oneTwentyPercentRule(
                            calcAmps,
                            Math.min(mainBusRating, feedthroughBusRating),
                            newMainBreakerRating
                        )
                    ) {
                        if (breakerSpaceFeedthrough) {
                            interconnections.push("BACKFEEDBREAKERWDERATEFEEDTHROUGH") //IN FEED THROUGH
                        }
                    }
                    // if main breaker in sub exists
                    // if main inside is <= main outside breaker or new outside main breaker (derated)
                    // show existing main
                    // else remove inside main
                    //if feedthroughMainRating then it's automatically convertible
                    if (feedthroughMainRating) {
                        if (newMainBreakerRating) {
                            if (feedthroughMainRating <= newMainBreakerRating) {
                                interconnections.push("BACKFEEDBREAKERWDERATEFEEDTHROUGHMAIN")
                            }
                        } else if (mainBreakerRating) {
                            if (feedthroughMainRating <= mainBreakerRating) {
                                interconnections.push("BACKFEEDBREAKERFEEDTHROUGHMAIN")
                            }
                        } else {
                            //add tag to remove main breaker
                        }
                    }
                }
            }
        }
        if (serviceStyle == "Separate Disconnect") {
            interconnections.push("SUPPLYSIDEMDISC", "SUPPLYSIDEMDISCLUGPOL")
            if (breakerSpaceMDP) {
                console.log(calcAmps, feedthroughBusRating, mainBreakerRating)
                if (oneTwentyPercentRule(calcAmps, feedthroughBusRating, mainBreakerRating)) {
                    interconnections.push("BACKFEEDBREAKERMDISC")
                } else if (
                    getDerateOptions(
                        panelCount,
                        inverterModel,
                        feedthroughBusRating,
                        mainBreakerRating
                    ).length
                ) {
                    derateOptions = getDerateOptions(
                        panelCount,
                        inverterModel,
                        feedthroughBusRating,
                        mainBreakerRating
                    )
                    interconnections.push("BACKFEEDBREAKERWDERATEMDISC")
                }
            }
        }
        if (serviceStyle == "Meter-Main Disconnect") {
            if (feedthroughConvertible) {
                interconnections.push("LOADSIDETAPMAINMETERMAINDISC")
            }
            if (!feedthroughConvertible) {
                interconnections.push("LOADSIDETAPMAINNEWFTMETERMAINDISC")
            }
            //if breaker space in feedthrough      
            if (breakerSpaceMDP) {
                //if no derate necessary and no main in feedthrough, feedthrough bus protected by main breaker
                if (oneTwentyPercentRule(calcAmps, feedthroughBusRating, mainBreakerRating)) {
                    interconnections.push("BACKFEEDBREAKERFEEDTHROUGHMETERMAINDISC")
                } else if (
                    getDerateOptions(
                        panelCount,
                        inverterModel,
                        feedthroughBusRating,
                        mainBreakerRating
                    ).length
                ) {
                    derateOptions = getDerateOptions(
                        panelCount,
                        inverterModel,
                        feedthroughBusRating,
                        mainBreakerRating
                    )
                    if (
                        newMainBreakerRating &&
                        mainBreakerRating - newMainBreakerRating >= calcAmps
                    ) {
                        // if (breakerSpaceMDP) {
                        //   interconnections.push("BACKFEEDBREAKERMMWDERATE");
                        // } else {
                        //   interconnections.push("LOADSIDETAPWDERATE");
                        // }
                        interconnections.push("LOADSIDETAPWDERATEMETERMAINDISC")
                    }
                    if (
                        newMainBreakerRating &&
                        oneTwentyPercentRule(
                            calcAmps,
                            Math.min(feedthroughBusRating, feedthroughBusRating),
                            newMainBreakerRating
                        )
                    ) {
                        if (breakerSpaceFeedthrough) {
                            interconnections.push(
                                "BACKFEEDBREAKERWDERATEFEEDTHROUGHMETERMAINDISC"
                            ) //IN FEED THROUGH
                        }
                    }
                    // if main breaker in sub exists
                    // if main inside is <= main outside breaker or new outside main breaker (derated)
                    // show existing main
                    // else remove inside main
                    if (feedthroughMainRating) {
                        if (newMainBreakerRating) {
                            if (feedthroughMainRating <= newMainBreakerRating) {
                                interconnections.push(
                                    "BACKFEEDBREAKERWDERATEFEEDTHROUGHMAINMETERMAINDISC"
                                )
                            }
                        } else if (mainBreakerRating) {
                            if (feedthroughMainRating <= mainBreakerRating) {
                                interconnections.push(
                                    "BACKFEEDBREAKERFEEDTHROUGHMAINMETERMAINDISC"
                                )
                            }
                        } else {
                            //add tag to remove main breaker
                        }
                    }
                }
            }
        }
        for (const interconnection in allInterconnections) {
            if (
                interconnections.includes(allInterconnections[interconnection].value)
            ) {
                preferredInterconnection = allInterconnections[interconnection].value
                break
            }
        }
    }
    //strip duplicate values
    interconnections = removeDuplicateStrings(interconnections)
    interconnections = interconnections
        .map((item) => {
            let myConnection = allInterconnections.find((con) => {
                return con.value == item
            })
            return myConnection
        })
        .filter((item) => {
            return item
        })

    // console.log("Interconnections are: ", interconnections);
    let interconnectionValues = interconnections.map(
        (interconnection) => interconnection.value
    )
    // if (
    //   !interconnectionValues.includes(window.store.projectData.interconnections)
    // ) {
    //   window.store.projectData.interconnections = preferredInterconnection
    //   console.log("got here")
    // }
    //window.store.projectData.interconnections = preferredInterconnection;

    return interconnections
    // return {
    //   interconnections: interconnections,
    //  };
}

function oneTwentyPercentRule(calcAmps, busRating, mainBreakerRating) {
    if (calcAmps <= busRating * 0.2 + (busRating - mainBreakerRating)) {
        return true
    }
}
function getDerateOptions(
    panelCount,
    inverterModel,
    busRating,
    mainBreakerRating
) {
    if (!mainBreakerRating) {
        //get main breaker ratings
        let derateOptions = [null, busRating]
        mainBreakerRating = busRating
        for (let index = 1; index <= 3; index++) {
            mainBreakerRating = mainBreakerRating - 25
            if (mainBreakerRating >= 100) {
                derateOptions.push(mainBreakerRating)
            }
        }
        return derateOptions
    } else {
        let inverter = Inverters.find(
            (inverter) => inverter.label == inverterModel
        )

        let numInverters = getNumInverters(panelCount, inverter)
        let continuousAmps = numInverters * inverter.maxACCurrent
        let calcAmps = continuousAmps * 1.25
        let breaker = false
        let derateOptions = [null]
        for (let index = 1; index <= 3; index++) {
            mainBreakerRating = mainBreakerRating - 25
            if (mainBreakerRating >= 100) {
                if (oneTwentyPercentRule(calcAmps, busRating, mainBreakerRating)) {
                    if (!breaker) {
                        breaker = mainBreakerRating
                    }
                    derateOptions.push(mainBreakerRating)
                }
            }
        }
        return derateOptions
    }
}

export { getInterconnections }