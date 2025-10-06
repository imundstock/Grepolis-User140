// ==UserScript==
// @name         BUILD ATUALIZADA
// @author       .Shinigami
// @description  Automatize the basic actions
// @version      1.1.1
// @match        https://*br142.grepolis.com/game/*
// @match        https://*br142.grepolis.com/game/*
// ==/UserScript==

(function () {
    'use strict';

    var uw;
    if (typeof unsafeWindow == 'undefined') uw = window;
    else uw = unsafeWindow;

    const get_finisched_tasks = () => {
        const { Progressable } = uw.MM.getCollections()
        const { models } = Progressable[0]
        let finisched = []
        for (let model of models) {
            let { attributes } = model
            if (attributes.state !== "satisfied") continue
            finisched.push(attributes)
        }
        return finisched
    }

    const claim_reward = (reward) => {
        const data = {
            "model_url": `Progressable/${reward.id}`,
            "action_name": "progressTo",
            "arguments": {
                "progressable_id": reward.progressable_id,
                "state": "closed"
            }
        }

        uw.gpAjax.ajaxPost("frontend_bridge", "execute", data)
    }

    const open_daily_login = (favorAmount) => {
        const max_favor = 550;
        const levels_reward = {
        }

        const data = {
            "window_type": "daily_login",
            "tab_type": "index",
            "known_data": {
                "models": [],
                "collections": [],
                "templates": []
            },
        }
        new Promise((resolve, reject) => {
            uw.gpAjax.ajaxGet("frontend_bridge", "fetch", data, false, (responseText) => {
                try {
                    const level = responseText.models.DailyLoginBonus.data.level;
                    const expectedFavor = levels_reward[level]?.favor;
                    if (expectedFavor) {
                        console.log(`Nível de recompensa: ${level}, Favor esperado: ${expectedFavor}, Favor atual: ${favorAmount}`);
                        if (expectedFavor + favorAmount < max_favor) {
                            claim_daily_reward();
                        }
                    }
                    resolve();
                } catch (err) {
                    console.error("Erro ao analisar o nível de recompensa:", err);
                    reject(err);
                }
            });
        });
    }

    const claim_daily_reward = () => {
        const data = {
            "model_url": `DailyLoginBonus/${uw.Game.player_id}`,
            "action_name": "accept",
            "captcha": null,
            "arguments": {
                "option": 1
            },
        }
        uw.gpAjax.ajaxPost("frontend_bridge", "execute", data)
    }

    const set_hera = (town_id) => {
        const data = {
            "god_id": "hera",
            "town_id": town_id
        }
        uw.gpAjax.ajaxPost("building_temple", "change_god", data)
    }


    const cast_spell = (town_id) => {
        const data = {
            "model_url": "CastedPowers",
            "action_name": "cast",
            "arguments": {
                "power_id": "wedding",
                "target_id": town_id
            },
        }
        uw.gpAjax.ajaxPost("frontend_bridge", "execute", data)
    }

    function main() {
        if (!uw.modernBot || !uw.ITowns || !uw.ITowns.towns) return;
        if ($('.botcheck').length || $('#recaptcha_window').length || $('#hcaptcha_window').length) return;

        const stages = [
            { barracks: 1, farm: 3, lumber: 2, stoner: 2, ironer: 2, storage: 2, main: 2, temple: 3 },
            { barracks: 1, farm: 3, lumber: 3, stoner: 3, ironer: 3, storage: 5, main: 5 },
            { market: 5 },
            { main: 15, barracks: 5, farm: 10, storage: 15, academy: 13, temple: 10, stoner: 5, lumber: 5, ironer: 5 },
            { farm: 15, stoner: 15, lumber: 15, ironer: 15 },
            { docks: 10 },
            { main: 25, academy: 25 },
            { storage: 20, farm: 45, docks: 20 },
            { lumber: 40, ironer: 40, stoner: 40 },
            { market: 30, academy: 34, storage: 35, docks: 30 },
            { temple: 30, hide: 10 },
            { thermal: 1, trade_office: 1 }
        ];

        uw.modernBot.autoBuild.towns_buildings = uw.modernBot.autoBuild.towns_buildings || {};
        uw.modernBot.autoBuild.build_stage = uw.modernBot.autoBuild.build_stage || {};

        for (let town of Object.values(uw.ITowns.towns)) {
            const currentBuildings = town.buildings().attributes;
            let determinedStage = 0;

            for (let i = 0; i < stages.length; i++) {
                const stage = stages[i];
                let complete = Object.entries(stage).every(
                    ([building, level]) => currentBuildings[building] >= level
                );
                if (complete) determinedStage = i + 1;
                else break;
            }

            uw.modernBot.autoBuild.build_stage[town.id] = determinedStage;

            if (determinedStage < stages.length) {
                let mergedPlan = { ...currentBuildings };

                for (let [building, level] of Object.entries(stages[determinedStage])) {
                    // Só atualiza se o nível atual for menor que o planejado
                    if (!currentBuildings[building] || currentBuildings[building] < level) {
                        mergedPlan[building] = level;
                    }
                }
                uw.modernBot.autoBuild.towns_buildings[town.id] = mergedPlan;
            } else {
                delete uw.modernBot.autoBuild.towns_buildings[town.id];
            }

            let researches = town.researches().attributes;
            let buildings = town.buildings().attributes;
            const { research, building, level } = uw.modernBot.autoTrain.REQUIREMENTS['colonize_ship']
        }

        const town = uw.ITowns.getCurrentTown();
        const { wood, iron, stone, storage } = town.resources();
        const margin = 50;

        if (Object.keys(uw.ITowns.towns).length === 1) {
            const { hera_favor } = uw.ITowns.player_gods.attributes;
            if (hera_favor > 30 && wood + margin < storage && iron + margin < storage && stone + margin < storage) {
                cast_spell(town.id);
            }
            const buildings = town.buildings().attributes;
            if (buildings.temple > 0 && !town.god()) {
                set_hera(town.id);
                console.log("missing_god");
            }
        }

        if ($('#daily_login_icon').css('display') === 'block') {
            let god_town = uw.ITowns.getCurrentTown().god();
            const attributes = uw.ITowns.player_gods.attributes;

            if (god_town) {
                let favorKey = `${god_town}_favor`;
                let favorAmount = attributes[favorKey];
                if (favorAmount) {
                    open_daily_login(favorAmount);
                }
            }
        }

        if (!uw.modernBot.autoBootcamp.enable_auto_bootcamp) {
            uw.modernBot.autoBootcamp.toggle();
        }

        const missions = get_finisched_tasks();

        for (let mission of missions) {
            for (let reward of mission.static_data.rewards) {
                const { type, data, power_id } = reward;

                if (type === "resources") {
                    if (data.wood + wood + margin > storage) continue;
                    if (data.iron + iron + margin > storage) continue;
                    if (data.stone + stone + margin > storage) continue;
                    claim_reward(mission);
                    console.log("claim", mission);
                    return;
                }

                if (type === "units" || type === "favor") {
                    claim_reward(mission);
                    console.log("claim", mission);
                    return;
                }

                if (type === "power") {
                    if (["population_boost", "coins_of_wisdom"].includes(power_id)) {
                        claim_reward(mission);
                        return;
                    }
                }
            }
        }

    }

    setTimeout(() => {
        main();
        setInterval(main, 60000);
    }, 10000);
})();
